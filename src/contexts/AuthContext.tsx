import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setUnauthorizedHandler } from '../services/api'
import { loginRequest } from '../services/auth'
import type { AuthUser, LoginCredentials } from '../services/auth.types'
import {
  clearSession,
  getStoredUser,
  getValidToken,
  saveSession,
} from '../services/tokenStorage'
import { replaceRoute } from '../navigation/replaceRoute'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function sanitizeRedirectPath(path: string | null): string {
  if (!path) return '/home'
  // Garante que é um caminho interno seguro (começa com / e não com // ou protocolo)
  if (path.startsWith('/') && !path.startsWith('//') && !path.includes(':')) {
    return path
  }
  return '/home'
}

export interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const validToken = getValidToken()
    if (!validToken) {
      clearSession()
      return null
    }
    return getStoredUser()
  })

  const [isLoading, setIsLoading] = useState(false)

  // Registra o handler para 401 disparado pelos interceptores do Axios
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setUser(null)
      const current = window.location.pathname + window.location.search
      const fromParam = encodeURIComponent(current)
      replaceRoute(`/login?from=${fromParam}`)
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await loginRequest(credentials)
      saveSession(response.token, response.user)
      setUser(response.user)

      const searchParams = new URLSearchParams(window.location.search)
      const from = sanitizeRedirectPath(searchParams.get('from'))
      replaceRoute(from)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    clearSession()
    setUser(null)
    replaceRoute('/login')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getValidToken()),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const defaultAuthFallback: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  return context ?? defaultAuthFallback
}
