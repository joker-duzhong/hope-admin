import { lazy, Suspense } from 'react';
import { IconUserGroup, IconSettings } from '@arco-design/web-react/icon';
import ProtectedRoute from '@/core/components/ProtectedRoute';
import type { AppModule } from '@/core/types/module';

const UserList = lazy(() => import('./pages/User'));
const RoleList = lazy(() => import('./pages/Role'));

const Loading = () => <div>加载中...</div>;

export const systemModule: AppModule = {
  moduleMeta: {
    key: 'system',
    title: '系统管理',
    icon: <IconSettings />,
  },
  routes: [
    {
      element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
      children: [
        {
          path: 'system/users',
          element: (
            <Suspense fallback={<Loading />}>
              <UserList />
            </Suspense>
          ),
        },
        {
          path: 'system/roles',
          element: (
            <Suspense fallback={<Loading />}>
              <RoleList />
            </Suspense>
          ),
        },
      ],
    },
  ],
  menuMeta: [
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
    },
  ],
};
