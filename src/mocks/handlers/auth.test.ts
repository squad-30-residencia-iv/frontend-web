import axios from 'axios'
import { describe, expect, it } from 'vitest'
import { generateMockJwt } from '../jwtUtils'
import { mockUsers } from './auth'

describe('MSW Auth Handlers', () => {
  it('realiza login com credenciais válidas de analista e devolve token', async () => {
    const res = await axios.post('/api/v1/auth/login', {
      email: 'analista@portal.dev',
      password: 'Analista@123',
    })

    expect(res.status).toBe(200)
    expect(res.data.accessToken).toBeDefined()
    expect(res.data.tokenType).toBe('Bearer')
    expect(res.data.user.role).toBe('analyst')
    expect(res.data.user.email).toBe('analista@portal.dev')
  })

  it('realiza login com credenciais válidas de admin e devolve token', async () => {
    const res = await axios.post('/api/v1/auth/login', {
      email: 'admin@portal.dev',
      password: 'Admin@123',
    })

    expect(res.status).toBe(200)
    expect(res.data.accessToken).toBeDefined()
    expect(res.data.user.role).toBe('admin')
  })

  it('retorna 401 com credenciais incorretas', async () => {
    await expect(
      axios.post('/api/v1/auth/login', {
        email: 'analista@portal.dev',
        password: 'senha-errada',
      }),
    ).rejects.toMatchObject({
      response: {
        status: 401,
        data: {
          code: 'INVALID_CREDENTIALS',
        },
      },
    })
  })

  it('retorna 422 quando email ou senha não são fornecidos', async () => {
    await expect(
      axios.post('/api/v1/auth/login', {
        email: 'analista@portal.dev',
      }),
    ).rejects.toMatchObject({
      response: {
        status: 422,
        data: {
          code: 'VALIDATION_FAILED',
        },
      },
    })
  })

  it('CA4: rota privada sem Bearer válido é rejeitada com 401', async () => {
    await expect(axios.get('/api/v1/auth/me')).rejects.toMatchObject({
      response: {
        status: 401,
        data: {
          code: 'UNAUTHORIZED',
        },
      },
    })

    await expect(
      axios.get('/api/v1/auth/me', {
        headers: { Authorization: 'Bearer token-invalido' },
      }),
    ).rejects.toMatchObject({
      response: {
        status: 401,
      },
    })
  })

  it('rota privada com token válido retorna o usuário autenticado', async () => {
    const token = generateMockJwt(mockUsers['analista@portal.dev'].user, 3600)
    const res = await axios.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    expect(res.data.email).toBe('analista@portal.dev')
    expect(res.data.name).toBe('Beatriz Analista')
  })

  it('logout revoga o token e requisição subsequente com o mesmo token retorna 401', async () => {
    const token = generateMockJwt(mockUsers['analista@portal.dev'].user, 3600)

    const logoutRes = await axios.post(
      '/api/v1/auth/logout',
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    expect(logoutRes.status).toBe(204)

    await expect(
      axios.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ).rejects.toMatchObject({
      response: {
        status: 401,
      },
    })
  })
})
