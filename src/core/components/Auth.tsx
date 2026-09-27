import React from 'react';
import { useUserStore } from '@/core/store/useUserStore';
import { ADMIN_APP_SCOPE } from '@/core/config';

interface AuthProps {
  allowedRoles: string[];
  roleScope: string;
  children: React.ReactNode;
}

/**
 * 权限包装组件：仅当用户拥有指定角色之一时才渲染子内容
 */
export const Auth: React.FC<AuthProps> = ({ allowedRoles, roleScope, children }) => {
  const { token, userInfo, appScope } = useUserStore();

  if (!token || !userInfo || appScope !== ADMIN_APP_SCOPE) {
    return null;
  }

  if (userInfo.is_superuser === true) {
    return <>{children}</>;
  }

  const hasRole = userInfo.roles?.some(
    (role) => role.scope === roleScope && allowedRoles.includes(role.code)
  );

  return hasRole ? <>{children}</> : null;
};
