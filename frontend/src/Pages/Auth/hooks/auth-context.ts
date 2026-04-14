import { createContext, useContext } from 'react'

import type { LoginCredentials, UserSession } from '../interfaces/types'

export type AuthContextValue = {
    isLoading: boolean
    session: UserSession | null
    signIn: (credentials: LoginCredentials) => Promise<UserSession>
    signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider.')
    }

    return context
}
