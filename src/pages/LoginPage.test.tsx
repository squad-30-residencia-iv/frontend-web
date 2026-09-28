import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('exibe campos identificados, obrigatórios e senha oculta', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible()
    expect(screen.getByLabelText('E-mail corporativo:')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('E-mail corporativo:')).toBeRequired()
    expect(screen.getByLabelText('Senha:')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Senha:')).toBeRequired()
  })

  it('impede envio vazio e informa integração pendente no envio válido', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await user.type(screen.getByLabelText('E-mail corporativo:'), 'teste@empresa.com')
    await user.type(screen.getByLabelText('Senha:'), 'senha-de-teste')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('status')).toHaveTextContent('A autenticação ainda não está conectada.')
    await user.type(screen.getByLabelText('Senha:'), '1')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
