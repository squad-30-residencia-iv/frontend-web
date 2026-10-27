import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { formatCount } from '../components/reports/reportFormatters'
import { defaultReportFilters } from '../data/reportFilters'
import { buildReport, reportCatalog } from '../data/reports'
import type { ReportData } from '../types/report'
import { ReportsPage } from './ReportsPage'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterEach(() => {
  window.history.replaceState(null, '', '/')
  vi.restoreAllMocks()
  Reflect.deleteProperty(URL, 'createObjectURL')
  Reflect.deleteProperty(URL, 'revokeObjectURL')
})
afterAll(() => vi.unstubAllGlobals())

const loadCatalog = () => Promise.resolve(reportCatalog)
const loadReport = (filters: Parameters<typeof buildReport>[0]) => Promise.resolve(buildReport(filters))
const emptyData: ReportData = buildReport({ ...defaultReportFilters, network: 'franchise', region: 'north' })

async function setup(path = '/relatorios', props: Partial<Parameters<typeof ReportsPage>[0]> = {}) {
  window.history.replaceState(null, '', path)
  const user = userEvent.setup()
  render(<ReportsPage loadCatalog={loadCatalog} loadReport={loadReport} {...props} />)
  await screen.findByRole('region', { name: 'Indicadores de vouchers' })
  return user
}

// O botão do Select tem o rótulo no nome; os botões "Remover filtro ..." dos chips são ignorados.
const filterButton = (label: RegExp) => screen.getAllByRole('button', { name: label }).find(button => !/Remover/.test(button.getAttribute('aria-label') ?? ''))!

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: RegExp, option: string) {
  await user.click(filterButton(label))
  await user.click(await screen.findByRole('option', { name: option }))
}

const kpis = () => screen.getByRole('region', { name: 'Indicadores de vouchers' })

describe('Relatórios e indicadores', () => {
  it('renderiza a rota com cabeçalho, sidebar ativa e sem o estado "Em construção"', async () => {
    window.history.replaceState(null, '', '/relatorios')
    render(<App />)
    expect(await screen.findByRole('region', { name: 'Indicadores de vouchers' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios e indicadores' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Caminho' })).getByText('Relatórios')).toHaveAttribute('aria-current', 'page')
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Relatórios' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('heading', { name: 'Em construção' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
  })

  it('mostra os cinco indicadores, gráficos e tabelas do período padrão', async () => {
    await setup()
    for (const value of ['5.899', '3.567', '892', '1.284', '60,5%']) expect(within(kpis()).getByText(value)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Utilização de vouchers' })).toBeVisible()
    expect(screen.getByRole('img', { name: /Gráfico de barras mensal/ })).toBeVisible()
    expect(screen.getByRole('img', { name: /Distribuição de 5.899 vouchers/ })).toBeVisible()
    const top = screen.getByRole('region', { name: 'Tabela de campanhas com rolagem horizontal' })
    expect(within(top).getAllByRole('row')).toHaveLength(6)
    expect(within(top).getAllByRole('row')[1]).toHaveTextContent('Black Friday 2024')
    const regions = screen.getByRole('region', { name: 'Tabela de regiões com rolagem horizontal' })
    expect(within(regions).getAllByRole('row')).toHaveLength(6)
    expect(within(regions).getByRole('columnheader', { name: 'Tkt Médio' })).toBeVisible()
  })

  it('só aplica os filtros ao clicar em Aplicar, atualiza chips e URL', async () => {
    const user = await setup()
    await selectOption(user, /Campanha:/, 'Black Friday 2024')
    expect(within(kpis()).getByText('5.899')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    const expected = formatCount(buildReport({ ...defaultReportFilters, campaign: 'black-friday' }).kpis.issued)
    expect(await within(kpis()).findByText(expected)).toBeVisible()
    expect(window.location.search).toBe('?campanha=black-friday')
    const chips = screen.getByRole('list', { name: 'Filtros aplicados' })
    expect(within(chips).getByText('Campanha: Black Friday 2024')).toBeVisible()
    expect(within(chips).getByText('Rede: Todas')).toBeVisible()
  })

  it('remove um filtro pelo chip e volta ao consolidado com Limpar filtros', async () => {
    const user = await setup('/relatorios?campanha=black-friday&periodo=90d')
    expect(within(kpis()).queryByText('5.899')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remover filtro Campanha: Black Friday 2024' }))
    await within(kpis()).findByText(formatCount(buildReport({ ...defaultReportFilters, period: '90d' }).kpis.issued))
    expect(window.location.search).toBe('?periodo=90d')
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(await within(kpis()).findByText('5.899')).toBeVisible()
    expect(window.location.search).toBe('')
    expect(screen.queryByRole('button', { name: /Remover filtro/ })).not.toBeInTheDocument()
  })

  it('lê filtros da URL e ignora valores inválidos', async () => {
    await setup('/relatorios?campanha=black-friday&rede=nao-existe&periodo=1y')
    const chips = screen.getByRole('list', { name: 'Filtros aplicados' })
    expect(within(chips).getByText('Campanha: Black Friday 2024')).toBeVisible()
    expect(within(chips).getByText('Rede: Todas')).toBeVisible()
    expect(within(chips).getByText('Período: Últimos 30 dias')).toBeVisible()
  })

  it('aplica a cascata Rede → Região: franquias não têm a região Norte', async () => {
    const user = await setup()
    await user.click(filterButton(/Região:/))
    expect(await screen.findByRole('option', { name: 'Norte' })).toBeVisible()
    await user.keyboard('{Escape}')
    await selectOption(user, /Rede:/, 'Franquias')
    await user.click(filterButton(/Região:/))
    expect(await screen.findByRole('option', { name: 'Sul' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Norte' })).not.toBeInTheDocument()
  })

  it('mostra a visão zerada, com taxa "—", quando os filtros não retornam vouchers', async () => {
    await setup('/relatorios', { loadReport: () => Promise.resolve(emptyData) })
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum voucher encontrado')
    expect(within(kpis()).getByText('—')).toBeVisible()
    expect(within(kpis()).getAllByText('0')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
    expect(screen.getByText('Sem dados de utilização para os filtros selecionados.')).toBeVisible()
  })

  it('exibe carregamento, erro e tenta novamente', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('falha'))
      .mockImplementation(loadReport)
    window.history.replaceState(null, '', '/relatorios')
    const user = userEvent.setup()
    render(<ReportsPage loadCatalog={loadCatalog} loadReport={load} />)
    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar os indicadores' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('region', { name: 'Indicadores de vouchers' })).toBeVisible()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('mostra o carregamento enquanto o relatório não chega', async () => {
    window.history.replaceState(null, '', '/relatorios')
    let resolve: (data: ReportData) => void = () => undefined
    render(<ReportsPage loadCatalog={loadCatalog} loadReport={() => new Promise<ReportData>(done => { resolve = done })} />)
    expect(await screen.findByText('Atualizando indicadores…')).toBeVisible()
    await act(async () => resolve(buildReport(defaultReportFilters)))
    expect(await screen.findByRole('region', { name: 'Indicadores de vouchers' })).toBeVisible()
  })

  it('trata falha no catálogo e a ausência de campanhas', async () => {
    window.history.replaceState(null, '', '/relatorios')
    const { unmount } = render(<ReportsPage loadCatalog={() => Promise.reject(new Error('falha'))} loadReport={loadReport} />)
    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar os relatórios' })).toBeVisible()
    unmount()
    render(<ReportsPage loadCatalog={() => Promise.resolve({ ...reportCatalog, campaigns: [] })} loadReport={loadReport} />)
    expect(await screen.findByRole('heading', { name: 'Nenhuma campanha cadastrada' })).toBeVisible()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Criar campanha' }))
    expect(window.location.pathname).toBe('/campanhas/nova')
  })

  it('exporta o CSV do recorte aplicado', async () => {
    const createObjectURL = vi.fn(() => 'blob:relatorio')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createObjectURL.mock.calls[0]).toEqual([expect.any(Blob)])
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:relatorio')
  })
})
