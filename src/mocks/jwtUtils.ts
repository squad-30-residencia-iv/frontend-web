import type { AuthUser, JwtPayload } from '../services/auth.types'

function toBase64(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str)
  }
  return Buffer.from(str, 'utf-8').toString('base64')
}

function fromBase64(str: string): string {
  const padded = str.padEnd(Math.ceil(str.length / 4) * 4, '=')
  if (typeof atob !== 'undefined') {
    return atob(padded)
  }
  return Buffer.from(padded, 'base64').toString('utf-8')
}

export function generateMockJwt(user: AuthUser, expiresInSeconds: number = 3600): string {
  const header = toBase64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload: JwtPayload & Record<string, unknown> = {
    sub: user.id,
    iat: now,
    exp: now + expiresInSeconds,
    name: user.name,
    email: user.email,
    role: user.role,
    networkId: user.networkId,
  }
  const payloadBase64 = toBase64(JSON.stringify(payload))
  const signature = toBase64('mock-signature')
  return `${header}.${payloadBase64}.${signature}`
}

export function parseMockJwt(token: string): (JwtPayload & Record<string, unknown>) | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const raw = fromBase64(parts[1])
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && 'sub' in parsed && 'exp' in parsed) {
      return parsed as JwtPayload & Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}
