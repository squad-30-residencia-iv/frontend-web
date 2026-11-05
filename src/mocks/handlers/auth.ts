import { delay, http, HttpResponse } from 'msw'
import type { AuthUser, LoginCredentials, LoginResponse } from '../../services/auth.types'
import { generateMockJwt, parseMockJwt } from '../jwtUtils'
import { mockConfig } from '../mockConfig'

export const mockUsers: Record<string, { user: AuthUser; password: string }> = {
  'analista@portal.dev': {
    password: 'Analista@123',
    user: {
      id: 'usr-analyst-1',
      name: 'Beatriz Analista',
      email: 'analista@portal.dev',
      role: 'analyst',
      organizationId: 'org-001',
    },
  },
  'admin@portal.dev': {
    password: 'Admin@123',
    user: {
      id: 'usr-admin-1',
      name: 'Carlos Administrador',
      email: 'admin@portal.dev',
      role: 'admin',
      organizationId: 'org-001',
    },
  },
}

const revokedTokens = new Set<string>()

export function resetAuthMockState() {
  revokedTokens.clear()
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

function findUserById(id: string): AuthUser | null {
  for (const entry of Object.values(mockUsers)) {
    if (entry.user.id === id) return entry.user
  }
  return null
}

export const authHandlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    if (mockConfig.latencyMs > 0) {
      await delay(mockConfig.latencyMs)
    }

    let body: Partial<LoginCredentials>
    try {
      body = (await request.json()) as Partial<LoginCredentials>
    } catch {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: 'Corpo da requisição inválido.' },
        { status: 400 },
      )
    }

    const { email, password } = body

    if (!email || !password) {
      return HttpResponse.json(
        { code: 'VALIDATION_FAILED', message: 'E-mail e senha são obrigatórios.' },
        { status: 422 },
      )
    }

    const entry = mockUsers[email.trim().toLowerCase()]
    if (!entry || entry.password !== password) {
      return HttpResponse.json(
        { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' },
        { status: 401 },
      )
    }

    const expiresIn = 3600
    const accessToken = generateMockJwt(entry.user, expiresIn)

    const response: LoginResponse = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: entry.user,
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  http.get('*/api/v1/auth/me', async ({ request }) => {
    if (mockConfig.latencyMs > 0) {
      await delay(mockConfig.latencyMs)
    }

    const token = extractBearerToken(request.headers.get('Authorization'))
    if (!token || revokedTokens.has(token)) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Token ausente, inválido ou expirado.' },
        { status: 401 },
      )
    }

    const payload = parseMockJwt(token)
    if (!payload || payload.exp * 1000 <= Date.now()) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Token expirado ou malformado.' },
        { status: 401 },
      )
    }

    const user = findUserById(payload.sub)
    if (!user) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Usuário não encontrado.' },
        { status: 401 },
      )
    }

    return HttpResponse.json(user, { status: 200 })
  }),

  http.post('*/api/v1/auth/logout', async ({ request }) => {
    if (mockConfig.latencyMs > 0) {
      await delay(mockConfig.latencyMs)
    }

    const token = extractBearerToken(request.headers.get('Authorization'))
    if (!token || revokedTokens.has(token)) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Token ausente ou revogado.' },
        { status: 401 },
      )
    }

    revokedTokens.add(token)
    return new HttpResponse(null, { status: 204 })
  }),
]
