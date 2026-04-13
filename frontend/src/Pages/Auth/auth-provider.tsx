import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { AuthContext } from "./hooks/auth-context"
import { login } from "./Actions/auth-api"
import type { LoginCredentials, UserSession } from "./interfaces/types"

const SESSION_STORAGE_KEY = "encuestas.user-session"

function isUserSession(value: unknown): value is UserSession {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const session = value as Record<keyof UserSession, unknown>

  return (
    typeof session.id === "string" &&
    typeof session.nombre === "string" &&
    typeof session.email === "string" &&
    (session.rol === "ADMIN" || session.rol === "PERSONAL") &&
    typeof session.token === "string"
  )
}

function getStoredSession() {
  const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(storedSession) as unknown

    if (isUserSession(parsedSession)) {
      return parsedSession
    }
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }

  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() =>
    getStoredSession(),
  )

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const response = await login(credentials)
    const nextSession: UserSession = {
      id: response.usuario.id,
      nombre: response.usuario.nombre,
      email: credentials.email,
      rol: response.usuario.rol,
      token: response.token,
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
