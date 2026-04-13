import { type ReactNode } from "react"
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { useAuth } from "@/Pages/Auth/hooks/auth-context"
import { AuthProvider } from "@/Pages/Auth/auth-provider"
import { LoginPage } from "@/Pages/Auth/Login"
import { AppHomePage } from "@/Pages/Dashboard/Dashboard"
import { CapturaPage } from "@/Pages/Encuestas/Captura"

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate replace to="/login" />
  }

  return children
}

export function AppRouter() {
  return (
    <AuthProvider>
      <Router>
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
          <Route element={<Navigate replace to="/login" />} path="*" />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
