import { delay, http, HttpResponse } from 'msw'
import type { AuthUser, LoginCredentials, LoginResponse } from '../../services/auth.types'
import { generateMockJwt } from '../jwtUtils'
import { mockConfig } from '../mockConfig'

export const mockUsers: Record<string, { user: AuthUser; password: string }> = {
  'analista@portal.dev': {
    password: 'Analista@123',
    user: {
      id: 'usr-analyst-1',
      name: 'Beatriz Analista',
      email: 'analista@portal.dev',
      role: 'analista',
      networkId: '0199e3a0-0000-7000-8000-000000000001',
    },
  },
  'gestor@portal.dev': {
    password: 'Gestor@123',
    user: {
      id: 'usr-manager-1',
      name: 'Bruno Costa',
      email: 'gestor@portal.dev',
      role: 'gestor',
      networkId: '0199e3a0-0000-7000-8000-000000000001',
    },
  },
  'admin@portal.dev': {
    password: 'Admin@123',
    user: {
      id: 'usr-admin-1',
      name: 'Carlos Administrador',
      email: 'admin@portal.dev',
      role: 'administrador',
      networkId: null,
    },
  },
}

export function resetAuthMockState() {
  // O token não é revogado no servidor. Sair só apaga a sessão do navegador.
}

function problem(status: number, code: string, detail: string) {
  return HttpResponse.json({ status, title: detail, detail, code }, { status })
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
      return problem(400, 'VALIDATION_ERROR', 'A requisição contém campos inválidos.')
    }

    const { email, password } = body

    if (!email || !password) {
      return problem(400, 'VALIDATION_ERROR', 'A requisição contém campos inválidos.')
    }

    const entry = mockUsers[email.trim().toLowerCase()]
    if (!entry || entry.password !== password) {
      return problem(401, 'AUTH_INVALID_CREDENTIALS', 'Credenciais inválidas.')
    }

    const expiresIn = 3600
    const response: LoginResponse = {
      token: generateMockJwt(entry.user, expiresIn),
      expiresIn,
      message: 'Autenticação realizada com sucesso.',
      profile: {
        userId: entry.user.id,
        email: entry.user.email,
        name: entry.user.name,
        role: entry.user.role,
        networkId: entry.user.networkId,
      },
    }

    return HttpResponse.json(response, { status: 200 })
  }),
]
