import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from '@heroui/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AuditPage } from './AuditPage'
import { App } from '../App'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { auditRecords } from '../data/auditRepository'
import * as auditExport from '../data/auditExport'
import type { AuditRecord } from '../types/audit'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterEach(() => { act(() => toast.clear()); vi.restoreAllMocks(); window.history.replaceState(null, '', '/') })
afterAll(() => vi.unstubAllGlobals())

async function setup(loadRecords?: () => Promise<readonly AuditRecord[]>) {
  const user = userEvent.setup()
  render(<><AuditPage loadRecords={loadRecords} /><FeedbackProvider /></>)
  await screen.findByRole('table')
  return user
}

function search(value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' }), { target: { value } })
  fireEvent.submit(screen.getByRole('form', { name: 'Filtros de auditoria' }))
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: RegExp, option: string) {
  await user.click(screen.getByRole('button', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}


describe('Auditoria', () => {
  it('substitui a rota provisória, mantém sidebar ativa e renderiza cards e tabela', async () => {
    window.history.replaceState(null, '', '/auditoria')
    render(<App />)
    expect(await screen.findByRole('table')).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Auditoria' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Caminho' })).getByText('Auditoria')).toHaveAttribute('aria-current', 'page')
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Auditoria' })).toHaveAttribute('aria-current', 'page')
    const summary = screen.getByRole('region', { name: 'Resumo de auditoria' })
    for (const [label, total] of [['Total de operações', '80'], ['Campanhas alteradas', '8'], ['Usuários responsáveis', '3'], ['Operações críticas', '45']]) {
      expect(within(summary).getByRole('heading', { name: label }).closest('article')).toHaveTextContent(total)
    }
    expect(screen.getAllByRole('row')).toHaveLength(8)
    expect(screen.getByText('20/11 às 14:30')).toBeVisible()
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('Exibindo 7 de 80 registros')
    expect(screen.getByRole('button', { name: 'Exportar histórico' })).toBeEnabled()
  })

  it('busca por código, campanha e responsável apenas ao aplicar e permite limpar', async () => {
    const user = await setup()
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' }), { target: { value: 'AUD-0001' } })
    expect(screen.getAllByRole('row')).toHaveLength(8)
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getAllByRole('row')).toHaveLength(2)
    search('black friday')
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('de 10 registros')
    search('ROBERTO')
    for (const row of screen.getAllByRole('row').slice(1)) expect(row).toHaveTextContent('Roberto Feitosa')
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' })).toHaveValue('')
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('de 80 registros')
    expect(screen.getByRole('heading', { name: 'Total de operações' }).closest('article')).toHaveTextContent('80')
  })

  it('combina operação e responsável e retorna à primeira página ao filtrar', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    await selectOption(user, /Operação:/, 'Bloqueio')
    await selectOption(user, /Responsável:/, 'Maria Eduarda Silva')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    for (const row of screen.getAllByRole('row').slice(1)) {
      expect(row).toHaveTextContent('Bloqueio')
      expect(row).toHaveTextContent('Maria Eduarda Silva')
      expect(row).toHaveTextContent('Bloqueada')
    }
  })

  it('aplica o período pelas datas das operações', async () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const records = [
      { ...auditRecords[0], occurredAt: `${today}T14:30:00-03:00`, campaignName: 'Campanha atual' },
      { ...auditRecords[1], occurredAt: '2000-01-01T14:30:00-03:00', campaignName: 'Campanha antiga' },
    ]
    const user = await setup(() => Promise.resolve(records))
    await selectOption(user, /Período:/, 'Últimos 30 dias')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getByRole('rowheader', { name: 'Campanha atual' })).toBeVisible()
    expect(screen.queryByRole('rowheader', { name: 'Campanha antiga' })).not.toBeInTheDocument()
  })

  it('mostra vazio, limpa filtros e bloqueia exportação sem resultados', async () => {
    const user = await setup()
    search('não existe')
    expect(screen.getByRole('heading', { name: 'Nenhum registro encontrado' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Exportar histórico' })).toBeDisabled()
    await user.click(within(screen.getByRole('region', { name: 'Registros de auditoria' })).getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getByRole('table')).toBeVisible()
  })

  it('pagina até os três registros finais e retorna', async () => {
    const user = await setup()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página 12' }))
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('Exibindo 3 de 80 registros')
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página 1' }))
    expect(screen.getByRole('button', { name: 'Ações de AUD-0001' })).toBeVisible()
  })

  it('exporta todos os resultados aplicados, inclusive os fora da página atual', async () => {
    const exportCsv = vi.spyOn(auditExport, 'downloadAuditCsv').mockImplementation(() => {})
    const user = await setup()
    search('black friday')
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    // Uma edição ainda não aplicada não deve mudar o arquivo exportado.
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' }), { target: { value: 'não aplicado' } })
    await user.click(screen.getByRole('button', { name: 'Exportar histórico' }))
    const records = exportCsv.mock.calls[0][0]
    expect(records).toHaveLength(10)
    expect(records.every(item => item.campaignName === 'Black Friday 2024')).toBe(true)
    expect(await screen.findByText('Histórico exportado.')).toBeVisible()
  })

  it('informa falha de exportação e mantém busca e resultados', async () => {
    vi.spyOn(auditExport, 'downloadAuditCsv').mockImplementation(() => { throw new Error('Download indisponível') })
    const user = await setup()
    search('AUD-0001')
    await user.click(screen.getByRole('button', { name: 'Exportar histórico' }))
    expect(await screen.findByText('Não foi possível exportar o histórico.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' })).toHaveValue('AUD-0001')
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })

  it('mostra carregamento e depois vazio quando não há registros', async () => {
    let resolve!: (records: readonly AuditRecord[]) => void
    const loadRecords = () => new Promise<readonly AuditRecord[]>(done => { resolve = done })
    render(<AuditPage loadRecords={loadRecords} />)
    expect(screen.getByText('Carregando auditoria…')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Exportar histórico' })).toBeDisabled()
    await act(async () => { await Promise.resolve(); resolve([]) })
    expect(screen.getByText('Ainda não há operações registradas.')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('mostra erro e recupera os registros com Tentar novamente', async () => {
    const user = userEvent.setup()
    const loadRecords = vi.fn().mockRejectedValueOnce(new Error('Falha local')).mockResolvedValueOnce(auditRecords)
    render(<AuditPage loadRecords={loadRecords} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a auditoria')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('table')).toBeVisible()
    expect(loadRecords).toHaveBeenCalledTimes(2)
  })
})
