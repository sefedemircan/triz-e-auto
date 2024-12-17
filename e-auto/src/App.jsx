import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { DatesProvider } from '@mantine/dates'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Employees from './pages/Employees'
import ExEmployees from './pages/ExEmployees'
import VehicleDetails from './pages/VehicleDetails'
import SoldVehicles from './pages/SoldVehicles'
import FinancialReport from './pages/FinancialReport'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  components: {
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    ActionIcon: {
      defaultProps: {
        variant: 'light',
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        overlayProps: {
          blur: 3,
        },
      },
    },
  },
})

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'tr', firstDayOfWeek: 1 }}>
        <Notifications />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute>
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ex-employees"
                element={
                  <ProtectedRoute>
                    <ExEmployees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles/:id"
                element={
                  <ProtectedRoute>
                    <VehicleDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sold-vehicles"
                element={
                  <ProtectedRoute>
                    <SoldVehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financial-report"
                element={
                  <ProtectedRoute>
                    <FinancialReport />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </DatesProvider>
    </MantineProvider>
  )
}

export default App
