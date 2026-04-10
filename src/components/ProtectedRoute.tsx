import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, userInfo } = useUserStore();

  if (!token || !userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = userInfo.roles?.some((role) => allowedRoles.includes(role.code || role.name));
    if (!hasRole) {
      // For lack of a /403 page, we redirect to root or /403
      return <Navigate to="/" replace />; // You can change this to /403 if defined
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
