import axios from 'axios'
import { api } from './api'
import {
  isAuthUser,
  isLoginResponse,
  type ApiErrorBody,
  type AuthUser,
  type LoginCredentials,
  type LoginResponse,
} from './auth.types'

export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha inválidos.')
    this.name = 'InvalidCredentialsError'
  }
}

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const GENERIC_MESSAGE = 'Não foi possível concluir a operação.'

function toLoginError(error: unknown): Error {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status
    if (status === 401) return new InvalidCredentialsError()
    if (status === 400 || status === 422) {
      return new ApiError(error.response?.data?.message ?? GENERIC_MESSAGE, status)
    }
    return new ApiError(GENERIC_MESSAGE, status)
  }
  return new ApiError(GENERIC_MESSAGE)
}

/** POST /api/v1/auth/login */
export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data } = await api.post<unknown>('/api/v1/auth/login', credentials)
    if (!isLoginResponse(data)) throw new ApiError('Resposta inesperada do servidor.')
    return data
  } catch (error) {
    throw toLoginError(error)
  }
}

/** POST /api/v1/auth/logout. Recebe o token porque a sessão local já foi limpa quando isto roda. */
export async function logoutRequest(token: string): Promise<void> {
  await api.post('/api/v1/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } })
}

/** GET /api/v1/auth/me: usuário dono do token atual. */
export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<unknown>('/api/v1/auth/me')
  if (!isAuthUser(data)) throw new ApiError('Resposta inesperada do servidor.')
  return data
}