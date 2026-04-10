import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const Login = lazy(() => import('@/pages/Login/index'));

// Temporary dummy components for testing
const Dashboard = () => <div className="hope-card">仪表盘内容待开发...</div>;

const UserList = lazy(() => import('@/pages/System/User'));
const RoleList = lazy(() => import('@/pages/System/Role'));

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
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
        ],
      },
      {
         element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
         children: [
           {
              path: 'system/users',
              element: (
                <Suspense fallback={<div>加载中...</div>}>
                  <UserList />
                </Suspense>
              ),
           },
           {
              path: 'system/roles',
              element: (
                <Suspense fallback={<div>加载中...</div>}>
                  <RoleList />
                </Suspense>
              ),
           },
         ],
      }
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
