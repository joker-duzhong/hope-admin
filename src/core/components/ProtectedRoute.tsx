import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@/core/store/useUserStore';
import { ADMIN_APP_SCOPE } from '@/core/config';
import { appModules } from '@/router/modules';
import { isModuleOffShelf } from '@/core/types/module';
import { mergeAppCatalog } from '@/core/utils/appModules';
import { useAppCatalogStore } from '@/core/store/useAppCatalogStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  roleScope?: string;
  requireSuperuser?: boolean;
}

/**
 * 路由守卫：未登录跳转 /login，无权限跳转首页
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, roleScope, requireSuperuser }) => {
  const { token, userInfo, appScope } = useUserStore();
  const appCatalog = useAppCatalogStore((state) => state.apps);
  const catalogLoaded = useAppCatalogStore((state) => state.loaded);
  const fetchAppCatalog = useAppCatalogStore((state) => state.fetchAppCatalog);

  useEffect(() => {
    if (token && appScope === ADMIN_APP_SCOPE) {
      void fetchAppCatalog();
    }
  }, [appScope, fetchAppCatalog, token]);

  if (!token || !userInfo || appScope !== ADMIN_APP_SCOPE) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperuser && userInfo.is_superuser !== true) {
    return <Navigate to="/" replace />;
  }

  // 模块路由在应用目录返回前不渲染，避免下架模块通过直链短暂进入。
  if (roleScope && !catalogLoaded) {
    return <div>加载中...</div>;
  }

  const targetModule = roleScope
    ? mergeAppCatalog(appModules, appCatalog).find((module) => module.moduleMeta.appScope === roleScope)
    : undefined;
  if (
    targetModule &&
    isModuleOffShelf(targetModule.moduleMeta)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (userInfo.is_superuser === true) {
      return <Outlet />;
    }

    const hasRole = userInfo.roles?.some(
      (role) => role.scope === roleScope && allowedRoles.includes(role.code)
    );
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
