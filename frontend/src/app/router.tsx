import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout, RutaPorRol } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { InventarioPage } from '@/features/inventario/pages/InventarioPage'
import { RegistrarVentaPage } from '@/features/ventas/pages/RegistrarVentaPage'
import { HistorialVentasPage } from '@/features/ventas/pages/HistorialVentasPage'
import { ConciliacionPage } from '@/features/conciliacion/pages/ConciliacionPage'
import { ReportesPage } from '@/features/reportes/pages/ReportesPage'

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
        element: (
          <RutaPorRol roles={['administrador', 'vendedor', 'gerente']}>
            <HistorialVentasPage />
          </RutaPorRol>
        ),
      },
      {
        path: 'ventas/nueva',
        element: (
          <RutaPorRol roles={['administrador', 'vendedor']}>
            <RegistrarVentaPage />
          </RutaPorRol>
        ),
      },
      {
        path: 'conciliacion',
        element: (
          <RutaPorRol roles={['administrador', 'almacenero', 'gerente']}>
            <ConciliacionPage />
          </RutaPorRol>
        ),
      },
      {
        path: 'reportes',
        element: (
          <RutaPorRol roles={['administrador', 'gerente']}>
            <ReportesPage />
          </RutaPorRol>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
