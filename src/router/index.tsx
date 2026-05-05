import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/core/components/Layout';
import ProtectedRoute from '@/core/components/ProtectedRoute';
import { appModules } from './modules';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<div>加载中...</div>}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        // 仪表盘：仅需登录即可访问
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<div>加载中...</div>}>
                <Dashboard />
              </Suspense>
            ),
          },
        ],
      },
      // 各业务模块路由（每个模块自带权限守卫）
      ...appModules.flatMap((m) => m.routes),
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
