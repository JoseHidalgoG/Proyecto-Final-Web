import { type ReactNode } from "react"
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { useAuth } from "@/Pages/Auth/hooks/auth-context"
import { AuthProvider } from "@/Pages/Auth/auth-provider"
import { LoginPage } from "@/Pages/Auth/Login"
import { AppHomePage } from "@/Pages/Dashboard/Dashboard"
import { CapturaPage } from "@/Pages/Encuestas/Captura"
import { PendientesPage } from "@/Pages/Encuestas/Pendientes"
import { SyncQueueRuntime } from "@/Pages/Encuestas/SyncQueueRuntime"
import { MapaPage } from "@/Pages/Mapa/Mapa"
import { UsuariosPage } from "@/Pages/Usuarios/Usuarios"

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, session } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-sm text-muted-foreground">
        Validando sesión...
      </main>
    )
  }

  if (!session) {
    return <Navigate replace to="/login" />
  }

  return children
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isLoading, session } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-sm text-muted-foreground">
        Validando sesión...
      </main>
    )
  }

  if (!session) {
    return <Navigate replace to="/login" />
  }

  if (session.rol !== "ADMIN") {
    return <Navigate replace to="/app" />
  }

  return children
}

export function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <SyncQueueRuntime />
        <Routes>
          <Route element={<Navigate replace to="/login" />} path="/" />
          <Route element={<LoginPage />} path="/login" />
          <Route
            element={
              <ProtectedRoute>
                <AppHomePage />
              </ProtectedRoute>
            }
            path="/app"
          />
          <Route
            element={
              <ProtectedRoute>
                <CapturaPage />
              </ProtectedRoute>
            }
            path="/app/encuestas/nueva"
          />
          <Route
            element={
              <ProtectedRoute>
                <PendientesPage />
              </ProtectedRoute>
            }
            path="/app/pendientes"
          />
          <Route
            element={
              <ProtectedRoute>
                <MapaPage />
              </ProtectedRoute>
            }
            path="/app/mapa"
          />
          <Route
            element={
              <AdminRoute>
                <UsuariosPage />
              </AdminRoute>
            }
            path="/app/usuarios"
          />
          <Route element={<Navigate replace to="/login" />} path="*" />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
