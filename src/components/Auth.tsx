import React from 'react';
import { useUserStore } from '@/store/useUserStore';

interface AuthProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const Auth: React.FC<AuthProps> = ({ allowedRoles, children }) => {
  const { userInfo } = useUserStore();

  if (!userInfo || !userInfo.roles) {
    return null;
  }

  const hasRole = userInfo.roles.some((role) => allowedRoles.includes(role.code || role.name));

  return hasRole ? <>{children}</> : null;
};
