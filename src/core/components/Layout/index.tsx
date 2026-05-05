import React from 'react';
import { Layout as ArcoLayout, Menu, Button } from '@arco-design/web-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/core/store/useUserStore';
import { IconDashboard } from '@arco-design/web-react/icon';
import { appModules } from '@/router/modules';

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

  // 聚合所有模块的菜单元数据，并根据当前用户角色过滤
  const allMenuItems = appModules.flatMap((m) => m.menuMeta);

  const visibleMenuItems = allMenuItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return userInfo?.roles?.some((r) => item.roles!.includes(r.code || r.name));
  });

  return (
    <ArcoLayout style={{ height: '100vh', width: '100vw' }}>
      <Sider className="hope-sidebar" width={250}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'var(--hope-header-height)',
            fontSize: 22,
            fontWeight: 'bold',
            color: 'var(--hope-primary-color)',
          }}
        >
          Hope Admin
        </div>
        <Menu
          selectedKeys={[location.pathname]}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: '100%' }}
        >
          {/* 固定的仪表盘菜单项 */}
          <MenuItem key="/dashboard">
            <IconDashboard />
            仪表盘
          </MenuItem>

          {/* 各模块动态注入的菜单项 */}
          {visibleMenuItems.map((item) => (
            <MenuItem key={item.key}>
              {item.icon}
              {item.title}
            </MenuItem>
          ))}
        </Menu>
      </Sider>
      <ArcoLayout style={{ backgroundColor: 'var(--hope-bg-body)' }}>
        <Header className="hope-header" style={{ height: 'var(--hope-header-height)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--hope-text-primary)' }}>
              DashBoard
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 20, color: 'var(--hope-text-secondary)', fontWeight: 500 }}>
              {userInfo?.nickname || '用户'}
            </span>
            <Button onClick={handleLogout} type="text" status="danger">
              退出登录
            </Button>
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
