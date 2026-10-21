import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { InventarioPage } from '@/features/inventario/pages/InventarioPage'
import { RegistrarVentaPage } from '@/features/ventas/pages/RegistrarVentaPage'
import { HistorialVentasPage } from '@/features/ventas/pages/HistorialVentasPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'inventario',
        element: <InventarioPage />,
      },
      {
        path: 'ventas',
        element: <HistorialVentasPage />,
      },
      {
        path: 'ventas/nueva',
        element: <RegistrarVentaPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
