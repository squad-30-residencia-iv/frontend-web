import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { AuthProvider } from '../contexts/AuthContext'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { generateMockJwt } from '../mocks/jwtUtils'
import { mockUsers } from '../mocks/handlers/auth'
import { networkCampaigns } from '../mocks/handlers/campaigns'
import { server } from '../mocks/server'
import { TOKEN_KEY, USER_KEY } from '../services/tokenStorage'
import { clearToasts } from '../test/clearToasts'

const apiId = '0199e3a0-0000-7000-8000-000000000111'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterAll(() => vi.unstubAllGlobals())
afterEach(clearToasts)
afterEach(() => window.history.replaceState(null, '', '/'))

function signIn(email: 'analista@portal.dev' | 'gestor@portal.dev') {
  const account = mockUsers[email].user
  localStorage.setItem(TOKEN_KEY, generateMockJwt(account, 3600))
  localStorage.setItem(USER_KEY, JSON.stringify(account))
}

function open(path: string) {
  window.history.pushState(null, '', path)
  render(<AuthProvider><App /><FeedbackProvider /></AuthProvider>)
  return userEvent.setup()
}

function recordRequests() {
  const requests: string[] = []
  const onRequest = ({ request }: { request: Request }) => { requests.push(`${request.method} ${new URL(request.url).pathname}`) }
  server.events.on('request:start', onRequest)
  return { requests, stop: () => server.events.removeListener('request:start', onRequest) }
}

describe('Reabrir o rascunho gravado (US-021)', () => {
  it('abre o assistente preenchido e salva com PUT, sem criar outra campanha', async () => {
    networkCampaigns[0].scopes = [{ regionId: null, establishmentId: null, name: null, code: null, channels: ['Physical'] }]
    signIn('analista@portal.dev')
    const user = open(`/campanhas/${apiId}/editar`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar rascunho' })).toBeVisible()
    expect(await screen.findByRole('textbox', { name: /Nome da campanha/ })).toHaveValue('Volta às Aulas')
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument()

    await user.clear(screen.getByRole('textbox', { name: /Nome da campanha/ }))
    await user.type(screen.getByRole('textbox', { name: /Nome da campanha/ }), 'Volta às Aulas revisada')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('checkbox', { name: 'Toda a rede' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('heading', { name: 'Revisão' })

    const { requests, stop } = recordRequests()
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas revisada' })).toBeVisible()
    stop()

    expect(window.location.pathname).toBe(`/campanhas/${apiId}`)
    expect(requests).toContain(`PUT /api/v1/campaigns/${apiId}`)
    expect(requests).toContain(`PUT /api/v1/campaigns/${apiId}/scopes`)
    expect(requests.some(request => request === 'POST /api/v1/campaigns')).toBe(false)
  })

  it('campanha agendada não se edita: a rota explica a regra e não mostra o formulário', async () => {
    networkCampaigns[0].status = 'Scheduled'
    signIn('gestor@portal.dev')
    open(`/campanhas/${apiId}/editar`)

    expect(await screen.findByRole('heading', { name: 'Esta campanha não pode ser editada' })).toBeVisible()
    expect(screen.getByText(/a mecânica congela na aprovação/)).toBeVisible()
    expect(screen.queryByRole('textbox', { name: /Nome da campanha/ })).not.toBeInTheDocument()
  })
})

describe('Editar e duplicar no detalhe (US-021)', () => {
  it('o rascunho mostra Editar rascunho, que abre a edição', async () => {
    signIn('analista@portal.dev')
    const user = open(`/campanhas/${apiId}`)

    await user.click(await screen.findByRole('button', { name: 'Editar rascunho' }))

    expect(window.location.pathname).toBe(`/campanhas/${apiId}/editar`)
    expect(screen.queryByRole('button', { name: 'Duplicar' })).not.toBeInTheDocument()
  })

  it('fora de rascunho mostra Duplicar; a cópia abre na edição', async () => {
    networkCampaigns[0].status = 'Scheduled'
    signIn('gestor@portal.dev')
    const user = open(`/campanhas/${apiId}`)

    expect(await screen.findByText('Configuração congelada')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Editar rascunho' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Duplicar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Duplicar campanha' })
    expect(within(dialog).getByRole('textbox', { name: 'Nome da cópia' })).toHaveValue('Cópia de Volta às Aulas')
    await user.click(within(dialog).getByRole('button', { name: 'Duplicar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar rascunho' })).toBeVisible()
    expect(window.location.pathname).toMatch(/^\/campanhas\/0199e3a0-0000-7000-8000-0000000003\d{2}\/editar$/)
    expect(await screen.findByRole('textbox', { name: /Nome da campanha/ })).toHaveValue('Cópia de Volta às Aulas')
  })

  it('mostra o escopo gravado na configuração', async () => {
    networkCampaigns[0].scopes = [{ regionId: null, establishmentId: 'loja', name: 'Loja Centro', code: '001', channels: ['Physical'] }]
    signIn('analista@portal.dev')
    open(`/campanhas/${apiId}`)

    expect(await screen.findByText('001 — Loja Centro')).toBeVisible()
    expect(screen.getByText('Físico')).toBeVisible()
  })
})
