import type { LoginCredentials } from './auth.types'

export interface LoginFieldErrors {
  email?: string
  password?: string
}

export const loginFieldMessages = {
  emailRequired: 'Informe seu e-mail.',
  emailInvalid: 'Informe um e-mail válido.',
  passwordRequired: 'Informe sua senha.',
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida o preenchimento dos campos do login, sem chamar a API. */
export function validateLoginFields({ email, password }: LoginCredentials): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = loginFieldMessages.emailRequired
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = loginFieldMessages.emailInvalid
  }

  if (!password) {
    errors.password = loginFieldMessages.passwordRequired
  }

  return errors
}