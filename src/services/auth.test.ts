import { describe, expect, it } from 'vitest'
import { mockUsers } from '../mocks/handlers/auth'
import { InvalidCredentialsError, loginRequest } from './auth'

const analyst = mockUsers['analista@portal.dev'].user

describe('auth service', () => {
  it('loginRequest traduz token e profile para a sessão', async () => {
    const data = await loginRequest({
      email: 'analista@portal.dev',
      password: 'Analista@123',
    })

    expect(data.token).toBeDefined()
    expect(data.expiresIn).toBe(3600)
    expect(data.user).toEqual({
      id: analyst.id,
      name: analyst.name,
      email: analyst.email,
      role: 'analista',
      networkId: analyst.networkId,
    })
  })

  it('loginRequest com credenciais inválidas lança InvalidCredentialsError', async () => {
    await expect(
      loginRequest({
        email: 'analista@portal.dev',
        password: 'senha-errada',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})
