export type UserRole = 'analista' | 'gestor' | 'administrador'

/** Usuário da sessão. `networkId` é nulo para o administrador da plataforma. */
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  networkId: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

/** Perfil devolvido por POST /api/v1/auth/login. */
export interface UserProfile {
  userId: string
  email: string
  name: string
  role: UserRole
  networkId: string | null
}

/** Corpo da resposta de POST /api/v1/auth/login. */
export interface LoginResponse {
  token: string
  expiresIn: number
  message: string
  profile: UserProfile
}

/** Sessão já traduzida para o portal. O nome exibido vem de `profile.name`. */
export interface EstablishedSession {
  token: string
  expiresIn: number
  user: AuthUser
}

/** Corpo de erro. A API envia ProblemDetails (`detail` e `code`). */
export interface ApiErrorBody {
  code?: string
  detail?: string
  message?: string
}

/** Claims do JWT lidos no cliente só para checar expiração. A assinatura NÃO é validada aqui. */
export interface JwtPayload {
  sub: string
  /** Expiração, em segundos desde 1970 (epoch). */
  exp: number
  iat?: number
}

const USER_ROLES: readonly string[] = ['analista', 'gestor', 'administrador']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value)
}

function isNetworkId(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    isUserRole(value.role) &&
    isNetworkId(value.networkId)
  )
}

export function isUserProfile(value: unknown): value is UserProfile {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    isUserRole(value.role) &&
    isNetworkId(value.networkId)
  )
}

/** Valida em tempo de execução que a resposta do servidor segue o contrato da API. */
export function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    isRecord(value) &&
    typeof value.token === 'string' &&
    typeof value.expiresIn === 'number' &&
    typeof value.message === 'string' &&
    isUserProfile(value.profile)
  )
}

export function toAuthUser(profile: UserProfile): AuthUser {
  return {
    id: profile.userId,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    networkId: profile.networkId,
  }
}

export function formatPortalRole(role: string): string {
  if (role === 'administrador') return 'Administrador'
  if (role === 'gestor') return 'Gestor'
  if (role === 'analista') return 'Analista de Campanhas'
  return role
}
