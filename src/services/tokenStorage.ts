import { isAuthUser, type AuthUser, type JwtPayload } from './auth.types'

export const TOKEN_KEY = 'portal:auth:token'
export const USER_KEY = 'portal:auth:user'

/** O localStorage pode lançar erro (modo privado, cota cheia). Nesses casos tratamos como "sem sessão". */
function safely<T>(action: () => T, fallback: T): T {
  try {
    return action()
  } catch {
    return fallback
  }
}

export function saveSession(token: string, user: AuthUser) {
  safely(() => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }, undefined)
}

export function clearSession() {
  safely(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, undefined)
}

export function getToken(): string | null {
  return safely(() => localStorage.getItem(TOKEN_KEY), null)
}

export function getStoredUser(): AuthUser | null {
  return safely(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isAuthUser(parsed) ? parsed : null
  }, null)
}

/** Lê o payload de um JWT (header.payload.assinatura). Retorna null se o token for malformado. */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload: unknown = JSON.parse(atob(padded))
    if (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as JwtPayload).sub === 'string' &&
      typeof (payload as JwtPayload).exp === 'number'
    ) {
      return payload as JwtPayload
    }
    return null
  } catch {
    return null
  }
}

/** Token malformado conta como expirado. */
export function isTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return true
  return payload.exp * 1000 <= nowMs
}

/** Retorna o token guardado somente se ele existir e ainda estiver válido. */
export function getValidToken(): string | null {
  const token = getToken()
  return token && !isTokenExpired(token) ? token : null
}