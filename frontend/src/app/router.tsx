import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { useAuth } from "@/Pages/Auth/hooks/auth-context"
import { AuthProvider } from "@/Pages/Auth/auth-provider"
import { LoginPage } from "@/Pages/Auth/Login"
import { AppHomePage } from "@/Pages/Dashboard/Dashboard"

function ProtectedApp() {
  const { session } = useAuth()

  if (!session) {
    return <Navigate replace to="/login" />
  }

  return <AppHomePage />
}

export function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Navigate replace to="/login" />} path="/" />
          <Route element={<LoginPage />} path="/login" />
          <Route element={<ProtectedApp />} path="/app" />
          <Route element={<Navigate replace to="/login" />} path="*" />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
