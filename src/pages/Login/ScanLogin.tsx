import { useEffect, useState } from 'react';
import { Button, Spin } from '@arco-design/web-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import {
  createScanSessionApi, pollScanSessionApi, exchangeScanSessionApi,
  type LoginResponse, type ScanStatus,
} from '@/core/api/auth';
import { loginError, responseData, retryDeadline, scanUrl, useCountdown } from './utils';

interface ScanLoginProps {
  appKey: string;
  retryAt: number;
  onRetryAt: (deadline: number) => void;
  onLogin: (data: LoginResponse, signal: AbortSignal) => Promise<void>;
}

interface ScanView {
  status: ScanStatus | 'LOADING' | 'ERROR';
  transactionId?: string;
  message?: string;
}

const statusText: Record<ScanView['status'], string> = {
  LOADING: '正在生成二维码…',
  WAITING_SCAN: '请使用微信扫描二维码',
  PENDING: '扫码成功，请在手机上确认登录',
  CONFIRMED: '已确认，正在登录…',
  CONSUMED: '此二维码已使用，请刷新后重新扫码',
  CANCELLED: '已取消登录，可刷新二维码重试',
  EXPIRED: '二维码已过期，请刷新后重新扫码',
  ERROR: '登录暂时不可用，请重试',
};

export default function ScanLogin(props: ScanLoginProps) {
  const [revision, setRevision] = useState(0);
  return <ScanAttempt key={revision} {...props} onRefresh={() => setRevision((value) => value + 1)} />;
}

function ScanAttempt({ appKey, retryAt, onRetryAt, onLogin, onRefresh }: ScanLoginProps & { onRefresh: () => void }) {
  const [view, setView] = useState<ScanView>({ status: 'LOADING' });
  const [startAt] = useState(retryAt);
  const remaining = useCountdown(retryAt);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let pollTimer: number | undefined;
    let expiryTimer: number | undefined;

    const start = async () => {
      try {
        const created = responseData((await createScanSessionApi(appKey, signal)).data);
        if (signal.aborted) return;
        if (!created.transaction_id || !created.poll_token || created.status !== 'WAITING_SCAN') {
          throw new Error('二维码会话异常，请刷新重试');
        }
        const transactionId = created.transaction_id;
        const deadline = created.expires_at ? Date.parse(created.expires_at) : NaN;
        const expire = () => {
          setView({ status: 'EXPIRED' });
          window.clearTimeout(pollTimer);
          controller.abort();
        };
        if (Number.isFinite(deadline)) {
          if (deadline <= Date.now()) { expire(); return; }
          expiryTimer = window.setTimeout(expire, deadline - Date.now());
        }
        setView({ status: 'WAITING_SCAN', transactionId });
        const interval = Math.max(2, Number(created.poll_interval_seconds) || 2) * 1000;
        const poll = async () => {
          if (signal.aborted) return;
          let exchanging = false;
          try {
            const current = responseData((await pollScanSessionApi(transactionId, created.poll_token, signal)).data);
            if (signal.aborted) return;
            if (current.transaction_id !== transactionId) throw new Error('登录会话不匹配，请刷新重试');
            setView({ status: current.status, transactionId });
            if (current.status === 'CONFIRMED') {
              exchanging = true;
              // 兑换严格一次性；响应丢失也不能自动重试。
              window.clearTimeout(expiryTimer);
              if (!current.exchange_code) throw new Error('登录确认信息不完整，请重新扫码');
              const result = responseData((await exchangeScanSessionApi(transactionId, current.exchange_code, created.poll_token, signal)).data);
              if (!signal.aborted) await onLogin(result, signal);
            } else if (current.status === 'WAITING_SCAN' || current.status === 'PENDING') {
              pollTimer = window.setTimeout(poll, interval);
            } else {
              window.clearTimeout(expiryTimer);
              if (!['EXPIRED', 'CANCELLED', 'CONSUMED'].includes(current.status)) throw new Error('登录状态异常，请重新扫码');
            }
          } catch (error) {
            if (signal.aborted) return;
            const limitedUntil = retryDeadline(error);
            if (limitedUntil) onRetryAt(limitedUntil);
            if (limitedUntil && !exchanging) {
              setView((previous) => ({ ...previous, message: '请求较频繁，稍后自动继续查询' }));
              pollTimer = window.setTimeout(poll, Math.max(interval, limitedUntil - Date.now()));
              return;
            }
            window.clearTimeout(expiryTimer);
            setView({ status: axios.isAxiosError(error) && error.response?.status === 410 ? 'EXPIRED' : 'ERROR', message: loginError(error, '登录失败，请刷新二维码重新扫码') });
          }
        };
        pollTimer = window.setTimeout(poll, interval);
      } catch (error) {
        if (signal.aborted) return;
        const limitedUntil = retryDeadline(error);
        if (limitedUntil) onRetryAt(limitedUntil);
        setView({ status: 'ERROR', message: loginError(error, '获取二维码失败，请重试') });
      }
    };
    // 延迟到下一任务，避免 StrictMode 的试挂载创建无人使用的扫码事务。
    const startTimer = window.setTimeout(start, Math.max(0, startAt - Date.now()));
    return () => {
      controller.abort();
      window.clearTimeout(startTimer);
      window.clearTimeout(pollTimer);
      window.clearTimeout(expiryTimer);
    };
  }, [appKey, onLogin, onRetryAt, startAt]);

  const busy = view.status === 'LOADING' || view.status === 'CONFIRMED';
  const canRefresh = ['ERROR', 'EXPIRED', 'CANCELLED', 'CONSUMED', 'WAITING_SCAN', 'PENDING'].includes(view.status);
  const text = view.message || statusText[view.status];
  return (
    <div className="login-scan">
      <div className="login-qr">
        {view.status === 'WAITING_SCAN' && view.transactionId ? (
          <QRCodeSVG value={scanUrl(view.transactionId)} size={208} level="M" marginSize={4} title="微信登录二维码" />
        ) : (
          <div className="login-qr-status">
            {busy && <Spin />}
            <span>{view.status === 'LOADING' && remaining > 0 ? `请等待 ${remaining} 秒后生成二维码` : statusText[view.status]}</span>
          </div>
        )}
      </div>
      <p className="login-status" role="status" aria-live="polite">{text}</p>
      <p className="login-hint">在手机上完成登录，并确认本次授权。</p>
      {canRefresh && (
        <Button type="text" disabled={remaining > 0} onClick={onRefresh}>
          {remaining > 0 ? `${remaining} 秒后可刷新` : '刷新二维码'}
        </Button>
      )}
    </div>
  );
}
