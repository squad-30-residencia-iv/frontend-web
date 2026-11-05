import { beforeEach, describe, expect, it } from 'vitest'
import { generateMockJwt } from '../mocks/jwtUtils'
import { mockUsers } from '../mocks/handlers/auth'
import {
  clearSession,
  decodeJwtPayload,
  getStoredUser,
  getToken,
  getValidToken,
  isTokenExpired,
  saveSession,
  TOKEN_KEY,
  USER_KEY,
} from './tokenStorage'

const testUser = mockUsers['analista@portal.dev'].user

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('salva e recupera token e usuário', () => {
    saveSession('mock-token', testUser)

    expect(getToken()).toBe('mock-token')
    expect(getStoredUser()).toEqual(testUser)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('mock-token')
  })

  it('limpa sessão', () => {
    saveSession('mock-token', testUser)
    clearSession()

    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it('decodifica payload do JWT com sucesso', () => {
    const token = generateMockJwt(testUser, 3600)
    const payload = decodeJwtPayload(token)

    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe(testUser.id)
    expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('retorna null ao decodificar token malformado', () => {
    expect(decodeJwtPayload('token-sem-pontos')).toBeNull()
    expect(decodeJwtPayload('header.payloadInvalido.sig')).toBeNull()
  })

  it('identifica corretamente token expirado ou válido', () => {
    const expiredToken = generateMockJwt(testUser, -60)
    const validToken = generateMockJwt(testUser, 3600)

    expect(isTokenExpired(expiredToken)).toBe(true)
    expect(isTokenExpired(validToken)).toBe(false)
  })

  it('getValidToken retorna apenas token válido e não expirado', () => {
    const expiredToken = generateMockJwt(testUser, -60)
    saveSession(expiredToken, testUser)
    expect(getValidToken()).toBeNull()

    const validToken = generateMockJwt(testUser, 3600)
    saveSession(validToken, testUser)
    expect(getValidToken()).toBe(validToken)
  })
})
