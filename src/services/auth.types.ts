export type UserRole = 'analyst' | 'admin'

/** Usuário autenticado. `role` e `organizationId` definem o escopo de atuação. */
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  organizationId: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/** Corpo da resposta de POST /api/v1/auth/login. */
export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  /** Validade do token, em segundos. */
  expiresIn: number
  user: AuthUser
}

/** Corpo padrão de erro da API. */
export interface ApiErrorBody {
  code: string
  message: string
}

/** Claims do JWT lidos no cliente só para checar expiração. A assinatura NÃO é validada aqui. */
export interface JwtPayload {
  sub: string
  /** Expiração, em segundos desde 1970 (epoch). */
  exp: number
  iat?: number
}

const USER_ROLES: readonly string[] = ['analyst', 'admin']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string' &&
    USER_ROLES.includes(value.role) &&
    typeof value.organizationId === 'string'
  )
}

/** Valida em tempo de execução que a resposta do servidor segue o contrato. */
export function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    value.tokenType === 'Bearer' &&
    typeof value.expiresIn === 'number' &&
    isAuthUser(value.user)
  )
}