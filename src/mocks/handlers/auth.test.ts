import axios from 'axios'
import { describe, expect, it } from 'vitest'

describe('MSW Auth Handlers', () => {
  it('realiza login com credenciais válidas de analista e devolve o contrato da API', async () => {
    const res = await axios.post('/api/v1/auth/login', {
      email: 'analista@portal.dev',
      password: 'Analista@123',
    })

    expect(res.status).toBe(200)
    expect(res.data.token).toEqual(expect.any(String))
    expect(res.data.expiresIn).toBe(3600)
    expect(res.data.message).toBe('Autenticação realizada com sucesso.')
    expect(res.data.profile).toEqual({
      userId: 'usr-analyst-1',
      email: 'analista@portal.dev',
      role: 'analista',
      networkId: '0199e3a0-0000-7000-8000-000000000001',
    })
  })

  it('realiza login de administrador sem rede', async () => {
    const res = await axios.post('/api/v1/auth/login', {
      email: 'admin@portal.dev',
      password: 'Admin@123',
    })

    expect(res.status).toBe(200)
    expect(res.data.profile.role).toBe('administrador')
    expect(res.data.profile.networkId).toBeNull()
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
          code: 'AUTH_INVALID_CREDENTIALS',
          detail: 'Credenciais inválidas.',
        },
      },
    })
  })

  it('retorna 400 quando email ou senha não são fornecidos', async () => {
    await expect(
      axios.post('/api/v1/auth/login', {
        email: 'analista@portal.dev',
      }),
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          code: 'VALIDATION_ERROR',
        },
      },
    })
  })
})
