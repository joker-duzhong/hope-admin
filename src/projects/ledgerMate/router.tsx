/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { IconList } from '@arco-design/web-react/icon';
import ProtectedRoute from '@/core/components/ProtectedRoute';
import type { AppModule } from '@/core/types/module';

const LedgerMateCategoriesPage = lazy(() => import('./pages/Categories'));

const Loading = () => <div>加载中...</div>;

export const ledgerMateModule: AppModule = {
  moduleMeta: {
    key: 'ledgerMate',
    appScope: 'hope_ledger_mate',
    title: '账伴',
    icon: <IconList />,
  },
  routes: [
    {
      element: <ProtectedRoute roleScope="hope_ledger_mate" allowedRoles={['ledger_mate_admin']} />,
      children: [
        {
          path: 'apps/ledger-mate',
          element: <Navigate to="/apps/ledger-mate/categories" replace />,
        },
        {
          path: 'apps/ledger-mate/categories',
          element: (
            <Suspense fallback={<Loading />}>
              <LedgerMateCategoriesPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
  menuMeta: [
    {
      key: '/apps/ledger-mate/categories',
      title: '分类管理',
      icon: <IconList />,
      roles: ['ledger_mate_admin'],
    },
  ],
};
