import { describe, expect, it } from 'vitest'
import {
  loginFieldMessages,
  validateLoginFields,
} from './loginValidation'

describe('loginValidation', () => {
  it('exige e-mail e senha quando ambos estiverem vazios', () => {
    const errors = validateLoginFields({ email: '', password: '' })
    expect(errors.email).toBe(loginFieldMessages.emailRequired)
    expect(errors.password).toBe(loginFieldMessages.passwordRequired)
  })

  it('exige e-mail se houver apenas espaços', () => {
    const errors = validateLoginFields({ email: '   ', password: '123' })
    expect(errors.email).toBe(loginFieldMessages.emailRequired)
    expect(errors.password).toBeUndefined()
  })

  it('informa e-mail inválido se o formato não contiver @ ou domínio válido', () => {
    const errors = validateLoginFields({ email: 'usuariosemarroba', password: '123' })
    expect(errors.email).toBe(loginFieldMessages.emailInvalid)

    const errors2 = validateLoginFields({ email: 'usuario@semdominio', password: '123' })
    expect(errors2.email).toBe(loginFieldMessages.emailInvalid)
  })

  it('não acusa erros quando os campos estiverem preenchidos corretamente', () => {
    const errors = validateLoginFields({
      email: 'usuario@empresa.com.br',
      password: 'minha-senha-segura',
    })
    expect(errors.email).toBeUndefined()
    expect(errors.password).toBeUndefined()
  })
})
