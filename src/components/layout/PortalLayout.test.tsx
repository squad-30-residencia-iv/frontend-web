import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../../contexts/AuthContext'
import { generateMockJwt } from '../../mocks/jwtUtils'
import { mockUsers } from '../../mocks/handlers/auth'
import { TOKEN_KEY, USER_KEY } from '../../services/tokenStorage'
import { PortalLayout } from './PortalLayout'

const analyst = mockUsers['analista@portal.dev'].user

describe('PortalLayout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renderizado sem autenticação, exibe perfil padrão e não mostra botão Sair', () => {
    render(
      <PortalLayout>
        <div>Conteúdo de teste</div>
      </PortalLayout>,
    )

    expect(screen.getByText('Lucas Silva')).toBeVisible()
    expect(screen.getByText('Gestor de Marketing')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
  })

  it('renderizado com sessão autenticada, exibe o nome do usuário logado e o botão Sair', () => {
    const token = generateMockJwt(analyst, 3600)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(analyst))

    render(
      <AuthProvider>
        <PortalLayout>
          <div>Conteúdo autenticado</div>
        </PortalLayout>
      </AuthProvider>,
    )

    expect(screen.getByText('Beatriz Analista')).toBeVisible()
    expect(screen.getByText('Analista de Campanhas')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  it('sessão de gestor mostra o rótulo Gestor', () => {
    const gestor = mockUsers['gestor@portal.dev'].user
    const token = generateMockJwt(gestor, 3600)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(gestor))

    render(
      <AuthProvider>
        <PortalLayout>
          <div>Conteúdo autenticado</div>
        </PortalLayout>
      </AuthProvider>,
    )

    expect(screen.getByText('gestor@portal.dev')).toBeVisible()
    expect(screen.getByText('Gestor')).toBeVisible()
  })

  it('clicar em Sair encerra a sessão e remove o token', async () => {
    const user = userEvent.setup()
    const token = generateMockJwt(analyst, 3600)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(analyst))

    render(
      <AuthProvider>
        <PortalLayout>
          <div>Conteúdo</div>
        </PortalLayout>
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })
})
