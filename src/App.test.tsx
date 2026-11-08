import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { AuthProvider } from './contexts/AuthContext'
import { generateMockJwt } from './mocks/jwtUtils'
import { mockUsers } from './mocks/handlers/auth'
import { TOKEN_KEY, USER_KEY } from './services/tokenStorage'

const analystUser = mockUsers['analista@portal.dev'].user

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  )
}

describe('App - Rotas protegidas e Autenticação', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('CA2: sem token, /campanhas redireciona para /login', async () => {
    window.history.pushState({}, '', '/campanhas')
    renderApp()

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
      expect(window.location.search).toContain('from=%2Fcampanhas')
      expect(screen.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible()
    })
  })

  it('CA2: sem token, /home redireciona para /login', async () => {
    window.history.pushState({}, '', '/home')
    renderApp()

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
      expect(window.location.search).toContain('from=%2Fhome')
    })
  })

  it('com token válido, renderiza a página protegida', async () => {
    const validToken = generateMockJwt(analystUser, 3600)
    localStorage.setItem(TOKEN_KEY, validToken)
    localStorage.setItem(USER_KEY, JSON.stringify(analystUser))

    window.history.pushState({}, '', '/home')
    renderApp()

    await waitFor(() => {
      expect(screen.getByText('Portal Campanhas')).toBeVisible()
      expect(screen.getByText('Beatriz Analista')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
    })
  })

  it('CA3: clicar em Sair remove o token, encerra a sessão e retorna ao login', async () => {
    const user = userEvent.setup()
    const validToken = generateMockJwt(analystUser, 3600)
    localStorage.setItem(TOKEN_KEY, validToken)
    localStorage.setItem(USER_KEY, JSON.stringify(analystUser))

    window.history.pushState({}, '', '/home')
    renderApp()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
    })

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    await waitFor(() => {
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(USER_KEY)).toBeNull()
      expect(window.location.pathname).toBe('/login')
      expect(screen.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible()
    })
  })
})
