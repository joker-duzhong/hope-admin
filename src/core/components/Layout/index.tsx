import React, { useEffect, useMemo, useState } from 'react';
import { Layout as ArcoLayout, Menu, Button, Breadcrumb } from '@arco-design/web-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/core/store/useUserStore';
import { IconDashboard } from '@arco-design/web-react/icon';
import { appModules } from '@/router/modules';

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;
const Sider = ArcoLayout.Sider;
const Header = ArcoLayout.Header;
const Content = ArcoLayout.Content;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userInfo } = useUserStore();
  const [manualOpenKeys, setManualOpenKeys] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRoleCodes = useMemo(
    () => (userInfo?.roles || []).map((r) => r.code || r.name),
    [userInfo?.roles]
  );

  const isSuperAdmin = userInfo?.is_superuser === true;
  const hasMultipleRoles = userRoleCodes.length > 1;
  // 规则：超级管理员默认按多角色处理
  const useGroupedMenu = isSuperAdmin || hasMultipleRoles;

  // 过滤用户可见菜单并按模块分组
  const visibleModuleMenus = useMemo(
    () =>
      appModules
        .map((module) => {
          const visibleMenus = module.menuMeta.filter((item) => {
            if (isSuperAdmin) return true;
            if (!item.roles || item.roles.length === 0) return true;
            return userRoleCodes.some((code) => item.roles!.includes(code));
          });
          return {
            moduleMeta: module.moduleMeta,
            menuMeta: visibleMenus,
          };
        })
        .filter((module) => module.menuMeta.length > 0),
    [isSuperAdmin, userRoleCodes]
  );

  const visibleFlatMenus = useMemo(
    () => visibleModuleMenus.flatMap((module) => module.menuMeta),
    [visibleModuleMenus]
  );

  const routeOpenKeys = useMemo(
    () =>
      useGroupedMenu
        ? visibleModuleMenus
            .filter((module) =>
              module.menuMeta.some((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))
            )
            .map((module) => module.moduleMeta.key)
        : [],
    [useGroupedMenu, visibleModuleMenus, location.pathname]
  );

  // 当路由命中某个分组时，自动把该分组加入展开状态；同时保留用户手动展开的分组
  useEffect(() => {
    if (!useGroupedMenu) {
      setManualOpenKeys([]);
      return;
    }

    setManualOpenKeys((prev) => Array.from(new Set([...prev, ...routeOpenKeys])));
  }, [useGroupedMenu, routeOpenKeys]);

  const mergedOpenKeys = useMemo(
    () => (useGroupedMenu ? Array.from(new Set([...manualOpenKeys, ...routeOpenKeys])) : []),
    [useGroupedMenu, manualOpenKeys, routeOpenKeys]
  );

  const breadcrumbItems = useMemo(() => {
    if (location.pathname === '/dashboard') {
      return ['仪表盘'];
    }

    const matchedModule = visibleModuleMenus.find((module) =>
      module.menuMeta.some(
        (item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`)
      )
    );

    if (matchedModule) {
      const matchedMenu =
        matchedModule.menuMeta.find((item) => item.key === location.pathname) ||
        matchedModule.menuMeta
          .filter((item) => location.pathname.startsWith(`${item.key}/`))
          .sort((a, b) => b.key.length - a.key.length)[0];

      if (matchedMenu) {
        if (matchedModule.moduleMeta.title === matchedMenu.title) {
          return [matchedMenu.title];
        }
        return [matchedModule.moduleMeta.title, matchedMenu.title];
      }
    }

    const segments = location.pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments : ['首页'];
  }, [location.pathname, visibleModuleMenus]);

  return (
    <ArcoLayout
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      <Sider className="hope-sidebar" width={250} style={{ flex: '0 0 250px' }}>
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
          openKeys={mergedOpenKeys}
          onClickSubMenu={(_, openKeys) => setManualOpenKeys(openKeys as string[])}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: '100%' }}
        >
          {/* 固定的仪表盘菜单项 */}
          <MenuItem key="/dashboard">
            <IconDashboard />
            仪表盘
          </MenuItem>

          {/* 角色自动切换菜单模式：单角色平铺，多角色（含超级管理员）二级分组 */}
          {useGroupedMenu
            ? visibleModuleMenus.map((module) => (
                <SubMenu
                  key={module.moduleMeta.key}
                  title={
                    <>
                      {module.moduleMeta.icon}
                      {module.moduleMeta.title}
                    </>
                  }
                >
                  {module.menuMeta.map((item) => (
                    <MenuItem key={item.key}>
                      {item.icon}
                      {item.title}
                    </MenuItem>
                  ))}
                </SubMenu>
              ))
            : visibleFlatMenus.map((item) => (
                <MenuItem key={item.key}>
                  {item.icon}
                  {item.title}
                </MenuItem>
              ))}
        </Menu>
      </Sider>
      <ArcoLayout
        style={{
          backgroundColor: 'var(--hope-bg-body)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
        }}
      >
        <Header className="hope-header" style={{ height: 'var(--hope-header-height)' }}>
          <div style={{ flex: 1 }}>
            <Breadcrumb>
              {breadcrumbItems.map((item) => (
                <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>
              ))}
            </Breadcrumb>
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
