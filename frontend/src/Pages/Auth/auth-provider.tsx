import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { AuthContext } from "./hooks/auth-context"
import { memoryAuthStore } from "./Actions/memory-auth-store"
import type { LoginCredentials, UserSession } from "./interfaces/types"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() =>
    memoryAuthStore.getSession(),
  )

  const signIn = useCallback((credentials: LoginCredentials) => {
    const nextSession = memoryAuthStore.signIn(credentials)
    setSession(nextSession)
    return nextSession
  }, [])

  const signOut = useCallback(() => {
    memoryAuthStore.signOut()
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
