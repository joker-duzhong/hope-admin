import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input } from '@arco-design/web-react';
import { phoneLoginApi, sendSmsCodeApi, type LoginResponse } from '@/core/api/auth';
import { loginError, responseData, retryDeadline, useCountdown } from './utils';

interface PhoneLoginProps {
  appKey: string;
  sendAfter: number;
  onSendAfter: (deadline: number) => void;
  loginAfter: number;
  onLoginAfter: (deadline: number) => void;
  onLogin: (data: LoginResponse, signal: AbortSignal) => Promise<void>;
}

interface PhoneForm {
  phone: string;
  code: string;
}

export default function PhoneLogin({ appKey, sendAfter, onSendAfter, loginAfter, onLoginAfter, onLogin }: PhoneLoginProps) {
  const [form] = Form.useForm<PhoneForm>();
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const sendRemaining = useCountdown(sendAfter);
  const loginRemaining = useCountdown(loginAfter);
  const sendingRef = useRef(false);
  const submittingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    return () => controller.abort();
  }, []);

  const sendCode = async () => {
    if (sendingRef.current || submittingRef.current || Date.now() < sendAfter) return;
    sendingRef.current = true;
    try {
      await form.validate(['phone']);
    } catch {
      sendingRef.current = false;
      return;
    }
    const signal = controllerRef.current?.signal;
    if (!signal || signal.aborted) { sendingRef.current = false; return; }
    setSending(true);
    setError('');
    setSent(false);
    // 短信可能已发出，即使页面切换或响应丢失，也保留发送间隔。
    onSendAfter(Date.now() + 60_000);
    try {
      const result = (await sendSmsCodeApi(form.getFieldValue('phone').trim(), signal)).data;
      if (signal.aborted) return;
      if (result.code !== 200) throw new Error(result.message || '验证码发送失败');
      setSent(true);
    } catch (cause) {
      if (signal.aborted) return;
      const limitedUntil = retryDeadline(cause);
      if (limitedUntil) onSendAfter(Math.max(limitedUntil, Date.now() + 60_000));
      setError(loginError(cause, '验证码发送失败，请稍后重试'));
    } finally {
      sendingRef.current = false;
      if (!signal.aborted) setSending(false);
    }
  };

  const submit = async (values: PhoneForm) => {
    if (submittingRef.current || sendingRef.current || Date.now() < loginAfter) return;
    const signal = controllerRef.current?.signal;
    if (!signal || signal.aborted) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = responseData((await phoneLoginApi({ phone: values.phone.trim(), code: values.code, app_key: appKey }, signal)).data);
      if (!signal.aborted) await onLogin(result, signal);
    } catch (cause) {
      if (signal.aborted) return;
      const limitedUntil = retryDeadline(cause);
      if (limitedUntil) onLoginAfter(limitedUntil);
      setError(loginError(cause, '登录失败，请重新获取验证码后重试'));
    } finally {
      submittingRef.current = false;
      if (!signal.aborted) setSubmitting(false);
    }
  };

  return (
    <Form<PhoneForm> form={form} layout="vertical" onSubmit={submit} className="login-phone" disabled={submitting}>
      <Form.Item field="phone" label="手机号" rules={[
        { required: true, message: '请输入手机号' },
        { match: /^(?:\+86)?1[3-9]\d{9}$/, message: '请输入有效的中国大陆手机号' },
      ]} normalize={(value) => value?.trim()}>
        <Input type="tel" autoComplete="tel" maxLength={14} placeholder="请输入手机号" disabled={sending || submitting} />
      </Form.Item>
      <Form.Item label="短信验证码" required>
        <div className="login-code-row">
          <Form.Item field="code" noStyle={{ showErrorTip: true }} rules={[
            { required: true, message: '请输入短信验证码' },
            { match: /^\d{4}$/, message: '请输入 4 位短信验证码' },
          ]}>
            <Input aria-label="短信验证码" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="4 位验证码" />
          </Form.Item>
          <Button onClick={sendCode} loading={sending} disabled={sendRemaining > 0 || submitting}>
            {sendRemaining > 0 ? `${sendRemaining} 秒后重发` : '获取验证码'}
          </Button>
        </div>
      </Form.Item>
      {sent && <p className="login-status" role="status">验证码已发送，请查看手机短信。</p>}
      {error && <Alert type="error" content={error} className="login-alert" />}
      <Button htmlType="submit" type="primary" long loading={submitting} disabled={sending || loginRemaining > 0}>
        {loginRemaining > 0 ? `${loginRemaining} 秒后重试` : '登录'}
      </Button>
    </Form>
  );
}
