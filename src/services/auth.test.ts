import { describe, expect, it } from 'vitest'
import { generateMockJwt } from '../mocks/jwtUtils'
import { mockUsers } from '../mocks/handlers/auth'
import {
  fetchMe,
  InvalidCredentialsError,
  loginRequest,
  logoutRequest,
} from './auth'

const analyst = mockUsers['analista@portal.dev'].user

describe('auth service', () => {
  it('loginRequest com credenciais válidas retorna LoginResponse', async () => {
    const data = await loginRequest({
      email: 'analista@portal.dev',
      password: 'Analista@123',
    })

    expect(data.accessToken).toBeDefined()
    expect(data.tokenType).toBe('Bearer')
    expect(data.user.email).toBe('analista@portal.dev')
  })

  it('loginRequest com credenciais inválidas lança InvalidCredentialsError', async () => {
    await expect(
      loginRequest({
        email: 'analista@portal.dev',
        password: 'senha-errada',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('fetchMe com token válido via Authorization retorna o usuário', async () => {
    const token = generateMockJwt(analyst, 3600)
    // Simula header configurado no axios/interceptor
    const { api } = await import('./api')
    const prevHeader = api.defaults.headers.common['Authorization']
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    try {
      const user = await fetchMe()
      expect(user.id).toBe(analyst.id)
      expect(user.email).toBe(analyst.email)
    } finally {
      api.defaults.headers.common['Authorization'] = prevHeader
    }
  })

  it('logoutRequest envia logout para o backend/MSW', async () => {
    const token = generateMockJwt(analyst, 3600)
    await expect(logoutRequest(token)).resolves.toBeUndefined()
  })
})
