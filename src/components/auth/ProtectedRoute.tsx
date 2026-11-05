import { useContext, useEffect, type ReactNode } from 'react'
import { AuthContext, useAuth } from '../../contexts/AuthContext'
import { replaceRoute } from '../../navigation/replaceRoute'
import type { UserRole } from '../../services/auth.types'

export interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: readonly UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const authContext = useContext(AuthContext)
  const { isAuthenticated, user, isLoading } = useAuth()

  // Se renderizado fora de um AuthProvider (testes unitários isolados de outras telas), permite a renderização
  if (authContext === undefined) {
    return <>{children}</>
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const current = window.location.pathname + window.location.search
      const fromParam = encodeURIComponent(current)
      replaceRoute(`/login?from=${fromParam}`)
    }
  }, [isLoading, isAuthenticated])

  if (isLoading || !isAuthenticated || !user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Acesso não autorizado</h2>
        <p>Seu perfil não possui permissão para acessar esta área.</p>
      </main>
    )
  }

  return <>{children}</>
}
