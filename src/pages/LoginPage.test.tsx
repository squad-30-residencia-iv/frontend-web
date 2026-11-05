import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../contexts/AuthContext'
import { TOKEN_KEY, USER_KEY } from '../services/tokenStorage'
import { LoginPage } from './LoginPage'

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/login')
  })

  it('exibe campos identificados, obrigatórios e senha oculta', () => {
    renderLoginPage()
    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible()
    expect(screen.getByLabelText('E-mail corporativo:')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('E-mail corporativo:')).toBeRequired()
    expect(screen.getByLabelText('Senha:')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Senha:')).toBeRequired()
  })

  it('exibe erros de validação ao enviar com campos vazios sem chamar API', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Informe seu e-mail.')).toBeVisible()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('exibe erro de validação com formato de e-mail inválido', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('E-mail corporativo:'), 'invalido')
    await user.type(screen.getByLabelText('Senha:'), '123456')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible()
  })

  it('exibe alerta de erro quando as credenciais são incorretas', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('E-mail corporativo:'), 'analista@portal.dev')
    await user.type(screen.getByLabelText('Senha:'), 'SenhaErrada@999')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('CA1: login válido grava o token, guarda o perfil e redireciona', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('E-mail corporativo:'), 'analista@portal.dev')
    await user.type(screen.getByLabelText('Senha:'), 'Analista@123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy()
      expect(localStorage.getItem(USER_KEY)).toContain('analista@portal.dev')
      expect(window.location.pathname).toBe('/home')
    })
  })
})
