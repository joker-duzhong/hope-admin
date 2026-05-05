import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { IconSettings, IconUserGroup, IconFile, IconApps, IconImage, IconList } from '@arco-design/web-react/icon';
import ProtectedRoute from '@/core/components/ProtectedRoute';
import type { AppModule } from '@/core/types/module';

const AurakeyDashboardPage = lazy(() => import('./pages/Dashboard'));
const AurakeyUserOpsPage = lazy(() => import('./pages/UserOps'));
const AurakeyRefundPage = lazy(() => import('./pages/Refund'));
const AurakeyConfigPage = lazy(() => import('./pages/Config'));
const AurakeyGalleryPage = lazy(() => import('./pages/Gallery'));
const AurakeyProductsPage = lazy(() => import('./pages/Products'));

const Loading = () => <div>加载中...</div>;

export const aurakeyModule: AppModule = {
  moduleMeta: {
    key: 'aurakey',
    title: 'AuraKey',
    icon: <IconSettings />,
  },
  routes: [
    {
      element: <ProtectedRoute allowedRoles={['aurakey_admin', 'SUPER_ADMIN']} />,
      children: [
        {
          path: 'apps/aurakey',
          element: <Navigate to="/apps/aurakey/dashboard" replace />,
        },
        {
          path: 'apps/aurakey/dashboard',
          element: (
            <Suspense fallback={<Loading />}>
              <AurakeyDashboardPage />
            </Suspense>
          ),
        },
        {
          path: 'apps/aurakey/user-ops',
          element: (
            <Suspense fallback={<Loading />}>
              <AurakeyUserOpsPage />
            </Suspense>
          ),
        },
        {
          path: 'apps/aurakey/refund',
          element: (
            <Suspense fallback={<Loading />}>
              <AurakeyRefundPage />
            </Suspense>
          ),
        },
        {
          path: 'apps/aurakey/config',
          element: (
            <Suspense fallback={<Loading />}>
              <AurakeyConfigPage />
            </Suspense>
          ),
        },
        {
          path: 'apps/aurakey/gallery',
          element: (
            <Suspense fallback={<Loading />}>
              <AurakeyGalleryPage />
            </Suspense>
          ),
        },
        {
          path: 'apps/aurakey/products',
          element: (
            <Suspense fallback={<Loading />}>
              <AurakeyProductsPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
  menuMeta: [
    {
      key: '/apps/aurakey/dashboard',
      title: '仪表板',
      icon: <IconSettings />,
      roles: ['aurakey_admin', 'SUPER_ADMIN'],
    },
    {
      key: '/apps/aurakey/user-ops',
      title: '用户处理',
      icon: <IconUserGroup />,
      roles: ['aurakey_admin', 'SUPER_ADMIN'],
    },
    {
      key: '/apps/aurakey/refund',
      title: '订单退款',
      icon: <IconFile />,
      roles: ['aurakey_admin', 'SUPER_ADMIN'],
    },
    {
      key: '/apps/aurakey/config',
      title: '配置管理',
      icon: <IconApps />,
      roles: ['aurakey_admin', 'SUPER_ADMIN'],
    },
    {
      key: '/apps/aurakey/gallery',
      title: '画廊列表',
      icon: <IconImage />,
      roles: ['aurakey_admin', 'SUPER_ADMIN'],
    },
    {
      key: '/apps/aurakey/products',
      title: '商品列表',
      icon: <IconList />,
      roles: ['aurakey_admin', 'SUPER_ADMIN'],
    },
  ],
};