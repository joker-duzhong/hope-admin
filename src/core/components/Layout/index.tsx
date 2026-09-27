import React, { useEffect, useMemo, useState } from 'react';
import { Layout as ArcoLayout, Menu, Button, Breadcrumb, Tag } from '@arco-design/web-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/core/store/useUserStore';
import { IconDashboard, IconStop } from '@arco-design/web-react/icon';
import { appModules } from '@/router/modules';
import { isModuleOffShelf } from '@/core/types/module';
import { mergeAppCatalog } from '@/core/utils/appModules';
import { useAppCatalogStore } from '@/core/store/useAppCatalogStore';
import { ADMIN_APP_SCOPE } from '@/core/config';

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;
const Sider = ArcoLayout.Sider;
const Header = ArcoLayout.Header;
const Content = ArcoLayout.Content;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userInfo, token, appScope } = useUserStore();
  const appCatalog = useAppCatalogStore((state) => state.apps);
  const fetchAppCatalog = useAppCatalogStore((state) => state.fetchAppCatalog);
  const resetAppCatalog = useAppCatalogStore((state) => state.reset);
  const [manualOpenKeys, setManualOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    if (token && appScope === ADMIN_APP_SCOPE) {
      void fetchAppCatalog();
    } else {
      resetAppCatalog();
    }
  }, [appScope, fetchAppCatalog, resetAppCatalog, token]);

  const effectiveAppModules = useMemo(
    () => mergeAppCatalog(appModules, appCatalog),
    [appCatalog],
  );

  const handleLogout = () => {
    resetAppCatalog();
    logout();
    navigate('/login', { replace: true });
  };

  const userRoles = useMemo(
    () => userInfo?.roles || [],
    [userInfo?.roles]
  );

  const isSuperAdmin = userInfo?.is_superuser === true;
  const hasMultipleRoles = userRoles.length > 1;
  // 规则：超级管理员默认按多角色处理
  const useGroupedMenu = isSuperAdmin || hasMultipleRoles;

  // 过滤用户可见菜单并按模块分组
  const visibleModuleMenus = useMemo(
    () =>
      effectiveAppModules
        .filter((module) => isSuperAdmin || !module.moduleMeta.superuserOnly)
        .map((module) => {
          const visibleMenus = module.menuMeta.filter((item) => {
            if (isSuperAdmin) return true;
            if (!item.roles || item.roles.length === 0) return true;
            return userRoles.some(
              (role) => role.scope === module.moduleMeta.appScope && item.roles!.includes(role.code)
            );
          });
          return {
            moduleMeta: module.moduleMeta,
            menuMeta: visibleMenus,
          };
        })
        .filter((module) => module.menuMeta.length > 0),
    [effectiveAppModules, isSuperAdmin, userRoles]
  );

  const activeModuleMenus = useMemo(
    () =>
      visibleModuleMenus.filter((module) => {
        // 下架状态只由 is_active=false 决定；角色缺失由上面的菜单过滤处理。
        return !isModuleOffShelf(module.moduleMeta);
      }),
    [visibleModuleMenus]
  );

  const offShelfModuleMenus = useMemo(
    () => visibleModuleMenus.filter((module) => !activeModuleMenus.includes(module)),
    [activeModuleMenus, visibleModuleMenus]
  );

  const visibleFlatMenus = useMemo(
    () => activeModuleMenus.flatMap((module) => module.menuMeta),
    [activeModuleMenus]
  );

  const activeRouteOpenKeys = useMemo(
    () =>
      useGroupedMenu
        ? activeModuleMenus
            .filter((module) =>
              module.menuMeta.some((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))
            )
            .map((module) => module.moduleMeta.key)
        : [],
    [useGroupedMenu, activeModuleMenus, location.pathname]
  );

  const mergedOpenKeys = useMemo(
    () => (useGroupedMenu ? Array.from(new Set([...manualOpenKeys, ...activeRouteOpenKeys])) : []),
    [useGroupedMenu, manualOpenKeys, activeRouteOpenKeys]
  );

  const breadcrumbItems = useMemo(() => {
    if (location.pathname === '/dashboard') {
      return ['仪表盘'];
    }

    const matchedModule = activeModuleMenus.find((module) =>
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
  }, [location.pathname, activeModuleMenus]);

  const renderModuleTitle = (module: (typeof visibleModuleMenus)[number], offShelf = false) => (
    <span className="hope-sidebar-module-title">
      {module.moduleMeta.icon}
      <span>{module.moduleMeta.title}</span>
      {offShelf && <Tag size="small" color="gray">下架</Tag>}
    </span>
  );

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
          onClickMenuItem={(key) => {
            if (offShelfModuleMenus.some((module) => module.moduleMeta.key === key)) return;
            navigate(key);
          }}
          style={{ width: '100%' }}
        >
          {/* 固定的仪表盘菜单项 */}
          <MenuItem key="/dashboard">
            <IconDashboard />
            仪表盘
          </MenuItem>

          {/* 角色自动切换菜单模式：单角色平铺，多角色（含超级管理员）二级分组 */}
          {useGroupedMenu
            ? activeModuleMenus.map((module) => (
                <SubMenu
                  key={module.moduleMeta.key}
                  title={renderModuleTitle(module)}
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
          {offShelfModuleMenus.length > 0 && (
            <SubMenu
              key="off-shelf-modules"
              title={
                <span className="hope-sidebar-off-shelf-title">
                  <IconStop />
                  已下架
                </span>
              }
            >
              {offShelfModuleMenus.map((module) => (
                <MenuItem
                  key={module.moduleMeta.key}
                  disabled
                  className="hope-sidebar-off-shelf-item"
                >
                  {renderModuleTitle(module, true)}
                </MenuItem>
              ))}
            </SubMenu>
          )}
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
