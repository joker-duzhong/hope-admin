import { lazy, Suspense } from 'react';
import { IconBook } from '@arco-design/web-react/icon';
import ProtectedRoute from '@/core/components/ProtectedRoute';
import type { AppModule } from '@/core/types/module';

const TimeLibrary = lazy(() => import('./pages'));

const Loading = () => <div>加载中...</div>;

export const timelibraryModule: AppModule = {
  moduleMeta: {
    key: 'timelibrary',
    title: '时空图书馆',
    icon: <IconBook />,
  },
  routes: [
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: 'apps/timelibrary',
          element: (
            <Suspense fallback={<Loading />}>
              <TimeLibrary />
            </Suspense>
          ),
        },
      ],
    },
  ],
  menuMeta: [
    {
      key: '/apps/timelibrary',
      title: '时空图书馆',
      icon: <IconBook />,
    },
  ],
};
