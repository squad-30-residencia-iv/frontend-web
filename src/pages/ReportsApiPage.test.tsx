import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { App } from '../App'
import { AuthProvider, AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import { mockUsers } from '../mocks/handlers/auth'
import { generateMockJwt } from '../mocks/jwtUtils'
import { server } from '../mocks/server'
import { saveSession } from '../services/tokenStorage'
import { ReportsPage } from './ReportsPage'
import { api } from '../services/api'
import { emptyReportData } from '../services/reports'

const network = mockUsers['analista@portal.dev'].user.networkId!
const campaign = '0199e3a0-aaaa-7000-8000-000000000201'
const region = '0199e3a0-aaaa-7000-8000-000000000501'
const establishment = '0199e3a0-aaaa-7000-8000-000000000601'
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
})
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/relatorios') })
afterEach(() => vi.restoreAllMocks())
afterAll(() => vi.unstubAllGlobals())

function setup(role: 'analista' | 'gestor' | 'admin' = 'analista') {
  const user = mockUsers[`${role}@portal.dev`].user
  saveSession(generateMockJwt(user), user)
  return render(<AuthProvider><App /></AuthProvider>)
}
const ready = () => waitFor(() => expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeEnabled())
async function select(user: ReturnType<typeof userEvent.setup>, field: string, value: string) {
  await user.click(screen.getAllByRole('button', { name: new RegExp(`${field}:`) }).find(button => button.getAttribute('aria-haspopup') === 'listbox')!)
  await user.click(await screen.findByRole('option', { name: value }))
}

describe('Relatórios na sessão autenticada', () => {
  it.each(['analista', 'gestor'] as const)('%s vê toda a estrutura e somente filtros com suporte', async role => {
    setup(role)
    await ready()
    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios e indicadores' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Indicadores de vouchers' })).toHaveTextContent('1')
    expect(screen.getByRole('heading', { name: 'Utilização de vouchers' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Top 5 campanhas por utilização' })).toBeVisible()
    for (const label of ['Categoria:', 'Rede:', 'Tipo de cliente:']) expect(screen.queryByRole('button', { name: new RegExp(`${label}`) })).not.toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Relatórios' })).toHaveAttribute('aria-current', 'page')
  })
  it('mantém filtros, KPIs, gráficos e tabelas quando catálogo e overview estão vazios', async () => {
    server.use(http.get('*/api/v1/reports/catalog', () => HttpResponse.json({})),
      http.get('*/api/v1/reports/overview', () => HttpResponse.json({})))
    setup()
    await ready()
    expect(screen.getByText('Nenhum voucher encontrado')).toBeVisible()
    expect(within(screen.getByRole('region', { name: 'Indicadores de vouchers' })).getAllByText('0')).toHaveLength(4)
    expect(screen.getByRole('img', { name: 'Distribuição de 0 vouchers por status' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Desempenho por região' })).toBeVisible()
  })
  it('edita sem consultar, aplica parâmetros reais e limpa para o overview padrão', async () => {
    const queries: URLSearchParams[] = []
    server.use(http.get('*/api/v1/reports/overview', ({ request }) => {
      queries.push(new URL(request.url).searchParams)
      return HttpResponse.json(emptyReportData())
    }))
    setup()
    await ready()
    const user = userEvent.setup()
    await select(user, 'Campanha', 'Campanha demonstrativa')
    await select(user, 'Região', 'Região Norte')
    await select(user, 'Estabelecimento', 'Loja Centro')
    await select(user, 'Período', 'Últimos 90 dias')
    expect(queries).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await ready()
    expect(Object.fromEntries(queries[1])).toEqual({ networkId: network, period: '90d', campaignId: campaign, regionId: region, establishmentId: establishment })
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    await ready()
    expect(Object.fromEntries(queries[2])).toEqual({ networkId: network, period: '30d' })
  })
  it.each(['catalog', 'overview'])('recupera erro em %s sem ocultar o conteúdo', async endpoint => {
    let calls = 0
    server.use(http.get(`*/api/v1/reports/${endpoint}`, () => ++calls === 1
      ? HttpResponse.json({ detail: 'Relatório indisponível.' }, { status: 500 })
      : HttpResponse.json({})))
    setup()
    expect(await screen.findByText('Relatório indisponível.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Indicadores de vouchers' })).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await ready()
    expect(calls).toBe(2)
  })
  it('administrador sem rede recebe explicação e não consulta API nem mock local', async () => {
    const request = vi.fn()
    server.use(http.get('*/api/v1/reports/:endpoint', () => { request(); return HttpResponse.json({}) }))
    setup('admin')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Rede não definida' })).toBeVisible())
    expect(screen.getByRole('region', { name: 'Indicadores de vouchers' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeDisabled()
    expect(request).not.toHaveBeenCalled()
  })
  it('cancela transporte ao desmontar, mantendo a estrutura durante carregamento', async () => {
    const get = vi.spyOn(api, 'get')
    server.use(http.get('*/api/v1/reports/overview', async () => {
      await delay(500)
      return HttpResponse.json({})
    }))
    const { unmount } = setup()
    await waitFor(() => expect(get.mock.calls.some(call => call[0].includes('/overview'))).toBe(true))
    const signal = get.mock.calls.find(call => call[0].includes('/overview'))?.[1]?.signal
    expect(screen.getByText('Atualizando indicadores…')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Indicadores de vouchers' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeDisabled()
    unmount()
    await waitFor(() => expect(signal?.aborted).toBe(true))
  })
  it('não refaz consultas quando o contexto recria o usuário com o mesmo escopo', async () => {
    const calls = vi.fn()
    server.use(http.get('*/api/v1/reports/overview', () => { calls(); return HttpResponse.json({}) }))
    const user = mockUsers['analista@portal.dev'].user
    const auth: AuthContextValue = { user, isAuthenticated: true, isLoading: false, login: async () => {}, logout: async () => {} }
    const { rerender } = render(<AuthContext.Provider value={auth}><ReportsPage /></AuthContext.Provider>)
    await ready()
    rerender(<AuthContext.Provider value={{ ...auth, user: { ...user } }}><ReportsPage /></AuthContext.Provider>)
    await ready()
    expect(calls).toHaveBeenCalledTimes(1)
  })

  it('exporta UTF-8 com os filtros aplicados, sem usar edições pendentes nem filtros ignorados', async () => {
    const create = vi.fn((_blob: Blob) => 'blob:reports')
    const revoke = vi.fn()
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = create
    URL.revokeObjectURL = revoke
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      setup()
      await ready()
      const user = userEvent.setup()
      await select(user, 'Campanha', 'Campanha demonstrativa')
      await select(user, 'Período', 'Últimos 90 dias')
      await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
      await ready()
      await select(user, 'Período', 'Últimos 6 meses')
      await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
      const blob = create.mock.calls[0][0] as Blob
      expect(blob.type).toBe('text/csv;charset=utf-8')
      const text = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsText(blob)
      })
      expect(text).toContain('Período;Últimos 90 dias')
      expect(text).toContain('Campanha;Campanha demonstrativa')
      expect(text).not.toContain('Últimos 6 meses')
      expect(text).not.toContain('Tipo de cliente')
      expect(text).not.toContain('Categoria;')
      expect(click).toHaveBeenCalledOnce()
      expect(revoke).toHaveBeenCalledWith('blob:reports')
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })
})
