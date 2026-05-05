import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@/core/store/useUserStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

/**
 * 路由守卫：未登录跳转 /login，无权限跳转首页
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, userInfo } = useUserStore();

  if (!token || !userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = userInfo.roles?.some((role) => allowedRoles.includes(role.code || role.name));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
