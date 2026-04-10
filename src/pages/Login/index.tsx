import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Message, Card, Tabs, Spin } from '@arco-design/web-react';
import { loginApi, type LoginParams, getMeApi, getWechatQrcodeApi, getWechatStatusApi } from '@/api/auth';
import { useUserStore } from '@/store/useUserStore';
import { useNavigate } from 'react-router-dom';
import { WECHAT_APP_ID } from '@/config';

const Item = Form.Item;
const TabPane = Tabs.TabPane;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [qrcodeLoading, setQrcodeLoading] = useState(false);
  const [qrcodeError, setQrcodeError] = useState(false);
  const [wechatQrcodeData, setWechatQrcodeData] = useState<{scene_id: string, qr_url: string} | null>(null);
  const [qrcodeExpired, setQrcodeExpired] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  
  const { login } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleSubmit = async (values: LoginParams) => {
    setLoading(true);
    try {
      // 1. Post to login
      const res = await loginApi(values);
      if (res.data.code === 200) {
        const token = res.data.data.access_token;
        
        // 2. Temporarily save token to get user info if needed
        useUserStore.setState({ token });
        
        // 3. Fetch user info (assuming login doesn't return user directly as per swagger)
        const meRes = await getMeApi();
        if (meRes.data.code === 200) {
           Message.success('登录成功');
           const mockUser = {...meRes.data.data}; if (!mockUser.roles) mockUser.roles = []; if (!mockUser.roles.find(r => r.code === 'SUPER_ADMIN')) { mockUser.roles.push({id: 1, name: '超级管理员', code: 'SUPER_ADMIN', scope: 'global'}) }; login(token, mockUser);
           navigate('/');
        } else {
           useUserStore.getState().logout();
           Message.error('获取用户信息失败');
        }
      } else {
        Message.error(res.data.message || '登录失败');
      }
    } catch (error) {
       console.error(error);
       useUserStore.getState().logout();
       Message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (sceneId: string) => {
    if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
    
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const response = await getWechatStatusApi({ scene_id: sceneId });
        const data = response.data.data;
        
        if (data.status === 'SUCCESS') {
          if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
          
          const token = data.token!;
          const mockUser = { ...data.userInfo };
          if (!mockUser.roles) mockUser.roles = [];
          if (!mockUser.roles.find((r: any) => r.code === 'SUPER_ADMIN')) {
            mockUser.roles.push({ id: 1, name: '超级管理员', code: 'SUPER_ADMIN', scope: 'global' });
          }
          
          login(token, mockUser);
          Message.success('登录成功');
          navigate('/');
        } else if (data.status === 'EXPIRED') {
          if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
          setQrcodeExpired(true);
          Message.warning('二维码已过期，请刷新重试');
        }
      } catch (error) {
        console.error('轮询状态异常', error);
        if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
        setQrcodeError(true);
        setWechatQrcodeData(null);
      }
    }, 2500);
  };

  const initWechatLogin = async () => {
    setQrcodeExpired(false);
    setQrcodeError(false);
    setWechatQrcodeData(null);
    setQrcodeLoading(true);
    if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
    
    try {
      // 从全局配置获取 AppID
      const response = await getWechatQrcodeApi({ appid: WECHAT_APP_ID });
      const data = response.data.data;
      if (response.data.code === 200 && data) {
        setWechatQrcodeData(data);
        startPolling(data.scene_id);
      } else {
        setQrcodeError(true);
        Message.error(response.data.message || '获取二维码失败');
      }
    } catch (error) {
      console.error('获取二维码失败', error);
      setQrcodeError(true);
      Message.error('获取二维码失败');
    } finally {
      setQrcodeLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    if (key === '2') {
      // 切到扫码登录tab：如果没有二维码或已过期，重新获取；否则继续轮询
      if (!wechatQrcodeData || qrcodeExpired) {
        initWechatLogin();
      } else {
        // 有有效的二维码数据，重新开始轮询
        startPolling(wechatQrcodeData.scene_id);
      }
    } else {
      // 切到其他tab，停止轮询
      if (pollTimerRef.current !== null) clearInterval(pollTimerRef.current);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--hope-bg-body)', width: '100vw' }}>
      <Card className="hope-card" style={{ width: 420, padding: '12px 12px 24px' }}>
        <div style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: 24, fontWeight: 'bold', color: 'var(--hope-primary-color)' }}>
          Hope Admin
        </div>
        <Tabs defaultActiveTab="1" type="line" onChange={handleTabChange}>
          <TabPane key="1" title="账号登录">
            <Form form={form} onSubmit={handleSubmit} layout="vertical" style={{ marginTop: 24 }}>
              <Item field="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" onPressEnter={() => form.submit()} />
              </Item>
              <Item field="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="请输入密码" onPressEnter={() => form.submit()} />
              </Item>
              <Item>
                <Button type="primary" onClick={() => form.submit()} long loading={loading}>
                  登录
                </Button>
              </Item>
            </Form>
          </TabPane>
          <TabPane key="2" title="微信扫码">
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Spin tip="等待二维码功能加载..." loading={qrcodeLoading}>
                <div style={{ width: 200, height: 200, background: '#f2f3f5', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                  {wechatQrcodeData?.qr_url ? (
                    <>
                      <img src={wechatQrcodeData.qr_url} alt="微信登录二维码" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: qrcodeExpired ? 0.3 : 1 }} />
                      {qrcodeExpired && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{ color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, marginBottom: 8 }}>二维码已失效</span>
                          <Button type="primary" size="small" onClick={initWechatLogin}>点击刷新</Button>
                        </div>
                      )}
                    </>
                  ) : qrcodeError ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'var(--color-text-3)', marginBottom: 8 }}>获取二维码失败</span>
                      <Button type="primary" size="small" onClick={initWechatLogin}>点击重试</Button>
                    </div>
                  ) : (
                    !qrcodeLoading && '加载中...'
                  )}
                </div>
              </Spin>
              <p style={{ marginTop: 16, color: 'var(--color-text-2)' }}>
                请使用微信扫码关注我们的公众号，<br/>
                即可安全完成登录。
              </p>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;


