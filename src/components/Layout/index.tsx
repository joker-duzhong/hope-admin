import React from 'react';
import { Layout as ArcoLayout, Menu, Button } from '@arco-design/web-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { IconDashboard, IconSettings, IconUserGroup, IconBook } from '@arco-design/web-react/icon';

const MenuItem = Menu.Item;
const Sider = ArcoLayout.Sider;
const Header = ArcoLayout.Header;
const Content = ArcoLayout.Content;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userInfo } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuList = [
    {
      key: '/dashboard',
      title: '仪表盘',
      icon: <IconDashboard />,
    },
    {
      key: '/apps/TimeLibrary',
      title: '时空图书馆',
      icon: <IconBook />,
    },
    {
      key: '/system/users',
      title: '用户管理',
      icon: <IconUserGroup />,
      roles: ['SUPER_ADMIN'],
    },
    {
      key: '/system/roles',
      title: '角色管理',
      icon: <IconSettings />,
      roles: ['SUPER_ADMIN'],
    }
  ];

  return (
    <ArcoLayout style={{ height: '100vh', width: '100vw' }}>
      <Sider className="hope-sidebar" width={250}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'var(--hope-header-height)', fontSize: 22, fontWeight: 'bold', color: 'var(--hope-primary-color)' }}>
          Hope Admin
        </div>
        <Menu
          selectedKeys={[location.pathname]}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: '100%' }}
        >
          {menuList.map((m) => {
            if (m.roles && (!userInfo?.roles || !userInfo.roles.some(r => m.roles?.includes(r.code || r.name)))) {
                return null;
            }
            return (
              <MenuItem key={m.key}>
                {m.icon}
                {m.title}
              </MenuItem>
            );
          })}
        </Menu>
      </Sider>
      <ArcoLayout style={{ backgroundColor: 'var(--hope-bg-body)' }}>
        <Header className="hope-header" style={{ height: 'var(--hope-header-height)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--hope-text-primary)' }}>DashBoard</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 20, color: 'var(--hope-text-secondary)', fontWeight: 500 }}>{userInfo?.nickname || '用户'}</span>
            <Button onClick={handleLogout} type="text" status="danger">退出登录</Button>
          </div>
        </Header>
        <Content style={{ padding: '30px', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </ArcoLayout>
    </ArcoLayout>
  );
};

export default AppLayout;
