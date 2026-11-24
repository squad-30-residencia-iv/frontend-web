import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { AuthProvider } from '../contexts/AuthContext'
import { mockUsers } from '../mocks/handlers/auth'
import { generateMockJwt } from '../mocks/jwtUtils'
import { TOKEN_KEY, USER_KEY } from '../services/tokenStorage'
import { clearToasts } from '../test/clearToasts'

const originalGetAnimations = Element.prototype.getAnimations

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
  Element.prototype.getAnimations = () => []
})
afterAll(() => {
  vi.unstubAllGlobals()
  Element.prototype.getAnimations = originalGetAnimations
})
afterEach(clearToasts)
afterEach(() => window.history.replaceState(null, '', '/'))

function renderGroups(email: 'admin@portal.dev' | 'analista@portal.dev' = 'admin@portal.dev') {
  const user = mockUsers[email].user
  localStorage.setItem(TOKEN_KEY, generateMockJwt(user, 3600))
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.history.pushState({}, '', '/grupos')
  render(<AuthProvider><App /><FeedbackProvider /></AuthProvider>)
  return userEvent.setup()
}

describe('Grupos de clientes', () => {
  it('o analista vê acesso restrito e o item some da navegação', async () => {
    renderGroups('analista@portal.dev')
    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).queryByRole('link', { name: 'Grupos' })).not.toBeInTheDocument()
  })

  it('o administrador cria o grupo e grava a lista de CPFs', async () => {
    const user = renderGroups()
    expect(await screen.findByRole('heading', { name: 'Grupos de clientes' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Grupos' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Novo grupo' }))
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Clientes ouro')
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Clientes ouro')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'CPFs' }))
    await user.type(screen.getByRole('textbox', { name: 'Lista' }), '529.982.247-25\n111.444.777-35\n52998224725')
    await user.click(screen.getByRole('button', { name: 'Salvar lista' }))
    expect(await screen.findByText(/2 CPFs/)).toBeVisible()
  })

  it('reativa um grupo inativo', async () => {
    const user = renderGroups()
    await user.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Clientes prata')
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Ativo · 0 CPFs')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Inativar' }))
    expect(await screen.findByText('Inativo · 0 CPFs')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Inativar' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ativar' }))
    expect(await screen.findByText('Ativo · 0 CPFs')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Inativar' })).toBeVisible()
  })
})
