import React from 'react';
import { useUserStore } from '@/core/store/useUserStore';

interface AuthProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * 权限包装组件：仅当用户拥有指定角色之一时才渲染子内容
 */
export const Auth: React.FC<AuthProps> = ({ allowedRoles, children }) => {
  const { userInfo } = useUserStore();

  if (!userInfo || !userInfo.roles) {
    return null;
  }

  const hasRole = userInfo.roles.some((role) => allowedRoles.includes(role.code || role.name));

  return hasRole ? <>{children}</> : null;
};
