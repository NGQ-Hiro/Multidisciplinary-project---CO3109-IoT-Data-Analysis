import React from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from './layouts';
import { DashboardPage, AlertsPage, DevicePage, RecommendationsPage, LoginPage, RegisterPage } from './pages';
import { isAuthenticated } from './services';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const routes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // ...
      {

        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
      },
      {
        path: 'operations',
        element: <DevicePage />,
      },
      {
        path: 'recommendations',
        element: <RecommendationsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
