import axios from 'axios'
import { api } from './api'
import {
  isLoginResponse,
  toAuthUser,
  type ApiErrorBody,
  type EstablishedSession,
  type LoginCredentials,
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

function problemMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const body = data as ApiErrorBody
  return body.detail ?? body.message
}

function toLoginError(error: unknown): Error {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status
    if (status === 401) return new InvalidCredentialsError()
    if (status === 400 || status === 422) {
      return new ApiError(problemMessage(error.response?.data) ?? GENERIC_MESSAGE, status)
    }
    return new ApiError(GENERIC_MESSAGE, status)
  }
  return new ApiError(GENERIC_MESSAGE)
}

/** POST /api/v1/auth/login. Traduz `token` e `profile` para a sessão do portal. */
export async function loginRequest(credentials: LoginCredentials): Promise<EstablishedSession> {
  try {
    const { data } = await api.post<unknown>('/api/v1/auth/login', credentials)
    if (!isLoginResponse(data)) throw new ApiError('Resposta inesperada do servidor.')
    return {
      token: data.token,
      expiresIn: data.expiresIn,
      user: toAuthUser(data.profile),
    }
  } catch (error) {
    throw toLoginError(error)
  }
}
