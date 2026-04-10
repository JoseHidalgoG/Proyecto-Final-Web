import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-context";
import { AuthProvider } from "@/features/auth/auth-provider";
import { LoginPage } from "@/features/auth/login-page";
import { AppHomePage } from "@/features/dashboard/app-home-page";

function ProtectedApp() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  return <AppHomePage />;
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
  );
}
