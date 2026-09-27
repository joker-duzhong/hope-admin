import { useCallback, useState } from 'react';
import { Card, Message, Tabs } from '@arco-design/web-react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { LoginResponse } from '@/core/api/auth';
import { ADMIN_APP_SCOPE } from '@/core/config';
import { useUserStore } from '@/core/store/useUserStore';
import ScanLogin from './ScanLogin';
import PhoneLogin from './PhoneLogin';
import './index.css';

export default function Login() {
  const [mode, setMode] = useState('scan');
  const [scanRetryAt, setScanRetryAt] = useState(0);
  const [smsSendAfter, setSmsSendAfter] = useState(0);
  const [phoneLoginAfter, setPhoneLoginAfter] = useState(0);
  const { token, userInfo, appScope, login } = useUserStore();
  const navigate = useNavigate();

  const finishLogin = useCallback(async (data: LoginResponse, signal: AbortSignal) => {
    if (signal.aborted) return;
    if (data.app_scope !== ADMIN_APP_SCOPE || !data.access_token || !data.user?.id) {
      throw new Error('登录凭据不适用于管理后台，请重新登录');
    }
    const user = data.user;
    if (user.is_active === false || user.needs_phone_binding || !user.phone) {
      throw new Error('账号不可用或尚未绑定手机号，请在手机上完成验证');
    }
    const roles = user.roles || [];
    if (!user.is_superuser && roles.length === 0) {
      throw new Error('当前账号没有管理后台权限，请联系管理员');
    }
    login(data.access_token, { ...user, roles }, ADMIN_APP_SCOPE);
    Message.success('登录成功');
    navigate('/dashboard', { replace: true });
  }, [login, navigate]);

  if (token && userInfo && appScope === ADMIN_APP_SCOPE) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="login-page">
      <Card className="hope-card login-card">
        <h1 className="login-title">Hope Admin</h1>
        <Tabs activeTab={mode} onChange={setMode} className="login-tabs">
          <Tabs.TabPane key="scan" title="扫码登录" />
          <Tabs.TabPane key="phone" title="手机验证码" />
        </Tabs>
        {mode === 'scan' ? (
          <ScanLogin appKey={ADMIN_APP_SCOPE} retryAt={scanRetryAt} onRetryAt={setScanRetryAt} onLogin={finishLogin} />
        ) : (
          <PhoneLogin appKey={ADMIN_APP_SCOPE} sendAfter={smsSendAfter} onSendAfter={setSmsSendAfter} loginAfter={phoneLoginAfter} onLoginAfter={setPhoneLoginAfter} onLogin={finishLogin} />
        )}
      </Card>
    </main>
  );
}
