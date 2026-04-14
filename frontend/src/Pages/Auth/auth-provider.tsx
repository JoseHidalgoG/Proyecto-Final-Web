import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { AuthContext } from "./hooks/auth-context"
import { getCurrentSession, login, logout } from "./Actions/auth-api"
import type { LoginCredentials, UserSession } from "./interfaces/types"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<UserSession | null>(null)

  useEffect(() => {
    let isActive = true

    getCurrentSession()
      .then((response) => {
        if (isActive) {
          setSession(response.usuario)
        }
      })
      .catch(() => {
        if (isActive) {
          setSession(null)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const response = await login(credentials)
    const nextSession = response.usuario

    setSession(nextSession)
    return nextSession
  }, [])

  const signOut = useCallback(async () => {
    await logout()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      isLoading,
      session,
      signIn,
      signOut,
    }),
    [isLoading, session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
