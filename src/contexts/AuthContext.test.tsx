import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { generateMockJwt } from '../mocks/jwtUtils'
import { mockUsers } from '../mocks/handlers/auth'
import { api } from '../services/api'
import { TOKEN_KEY, USER_KEY } from '../services/tokenStorage'
import { AuthProvider, useAuth } from './AuthContext'

const analystUser = mockUsers['analista@portal.dev'].user

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthContext', () => {
  it('restaura sessão válida existente no localStorage', () => {
    const validToken = generateMockJwt(analystUser, 3600)
    localStorage.setItem(TOKEN_KEY, validToken)
    localStorage.setItem(USER_KEY, JSON.stringify(analystUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(analystUser)
  })

  it('descarta sessão caso o token esteja expirado', () => {
    // expira no passado (-10 segundos)
    const expiredToken = generateMockJwt(analystUser, -10)
    localStorage.setItem(TOKEN_KEY, expiredToken)
    localStorage.setItem(USER_KEY, JSON.stringify(analystUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it('login atualiza estado e grava no localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)

    await act(async () => {
      await result.current.login({
        email: 'analista@portal.dev',
        password: 'Analista@123',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe('analista@portal.dev')
    expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy()
    expect(localStorage.getItem(USER_KEY)).toContain('analista@portal.dev')
  })

  it('logout limpa sessão local e atualiza estado', async () => {
    const validToken = generateMockJwt(analystUser, 3600)
    localStorage.setItem(TOKEN_KEY, validToken)
    localStorage.setItem(USER_KEY, JSON.stringify(analystUser))

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it('resposta 401 em rota privada limpa a sessão via interceptor', async () => {
    const validToken = generateMockJwt(analystUser, 3600)
    localStorage.setItem(TOKEN_KEY, validToken)
    localStorage.setItem(USER_KEY, JSON.stringify(analystUser))

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)

    // Simulando 401 disparado pelo Axios
    await act(async () => {
      try {
        await api.get('/api/v1/auth/me', {
          headers: { Authorization: 'Bearer token-invalido' },
        })
      } catch {
        // Ignora o erro da resposta
      }
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
