import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from '@heroui/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { AuditOperationDetailsPage } from './AuditOperationDetailsPage'
import { auditRecords, loadAuditRecord } from '../data/auditRepository'
import * as auditExport from '../data/auditExport'
import type { AuditRecord } from '../types/audit'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterEach(() => { act(() => toast.clear()); vi.restoreAllMocks(); window.history.replaceState(null, '', '/') })
afterAll(() => vi.unstubAllGlobals())

async function setup(id = 'audit-1') {
  window.history.replaceState(null, '', `/auditoria/${id}`)
  render(<><App /><FeedbackProvider /></>)
  await screen.findByRole('table', { name: 'Alterações realizadas na operação' })
  return userEvent.setup()
}

async function openRow(user: ReturnType<typeof userEvent.setup>, code: string) {
  const button = screen.getByRole('button', { name: `Ações de ${code}` })
  button.focus()
  await user.keyboard('{Enter}')
  await user.click(await screen.findByRole('menuitem', { name: 'Ver detalhes' }))
  await screen.findByRole('table', { name: 'Alterações realizadas na operação' })
}

describe('Detalhes da operação', () => {
  it('navega pelos três pontos por teclado para o evento correspondente', async () => {
    window.history.replaceState(null, '', '/auditoria')
    render(<App />)
    await screen.findByRole('table')
    const user = userEvent.setup()
    await openRow(user, 'AUD-0002')
    expect(window.location.pathname).toBe('/auditoria/audit-2')
    expect(screen.getByRole('heading', { level: 1, name: 'Detalhes da operação' })).toBeVisible()
    const information = screen.getByRole('table', { name: 'Informações da operação AUD-0002' })
    expect(information).toHaveTextContent('Dia das Mães Premiado')
    expect(information).toHaveTextContent('Roberto Feitosa')
    expect(information).toHaveTextContent('Aprovação')
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Auditoria' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('carrega diretamente pelo ID e mostra somente informações e alterações da referência', async () => {
    await setup()
    const information = screen.getByRole('table', { name: 'Informações da operação AUD-0001' })
    for (const text of ['Black Friday 2024', '20/11 às 14:30', 'Maria Eduarda Silva', 'Edição', 'Analista', 'Ativa']) {
      expect(information).toHaveTextContent(text)
    }
    const changes = screen.getByRole('table', { name: 'Alterações realizadas na operação' })
    expect(within(changes).getAllByRole('row')).toHaveLength(4)
    for (const text of ['Quantidade total', '5.000 vouchers', '8.000 vouchers', 'Data de término', '30/11/2024', 'Canal permitido', 'Físico e virtual']) {
      expect(changes).toHaveTextContent(text)
    }
    expect(changes).not.toHaveTextContent('Rascunho')
    expect(screen.getByRole('region', { name: 'Justificativa' })).toHaveTextContent('A quantidade foi ampliada devido à alta adesão.')
    const breadcrumb = screen.getByRole('navigation', { name: 'Caminho' })
    expect(within(breadcrumb).getByRole('link', { name: 'Auditoria' })).toHaveAttribute('href', '/auditoria')
    expect(within(breadcrumb).getByText('Detalhes da operação')).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    ['audit-4', 'Limite de emissão excedido'],
    ['audit-5', 'Revisão prioritária'],
    ['audit-6', 'DEMO-VALIDATION'],
  ])('apresenta justificativa operacional de %s sem inventar alterações', async (id, text) => {
    await setup(id)
    expect(screen.getByRole('region', { name: 'Justificativa' })).toHaveTextContent(text)
    expect(screen.getByRole('table', { name: 'Alterações realizadas na operação' })).toHaveTextContent('Nenhuma alteração realizada neste evento.')
  })

  it('exporta exclusivamente o evento atual usando o exportador existente', async () => {
    const exportCsv = vi.spyOn(auditExport, 'downloadAuditCsv').mockImplementation(() => {})
    const user = await setup('audit-2')
    await user.click(screen.getByRole('button', { name: 'Exportar evento' }))
    expect(exportCsv).toHaveBeenCalledWith([auditRecords[1]], 'evento-AUD-0002.csv')
    expect(await screen.findByText('Evento exportado.')).toBeVisible()
  })

  it('mantém o registro visível quando a exportação falha', async () => {
    vi.spyOn(auditExport, 'downloadAuditCsv').mockImplementation(() => { throw new Error('Falha no download') })
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Exportar evento' }))
    expect(await screen.findByText('Não foi possível exportar o evento.')).toBeVisible()
    expect(screen.getByRole('table', { name: 'Informações da operação AUD-0001' })).toBeVisible()
  })

  it('volta preservando filtros aplicados, campos ainda não aplicados e página', async () => {
    window.history.replaceState(null, '', '/auditoria')
    render(<App />)
    await screen.findByRole('table')
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' })
    fireEvent.change(input, { target: { value: 'black friday' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Filtros de auditoria' }))
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    fireEvent.change(input, { target: { value: 'rascunho da busca' } })
    await openRow(user, 'AUD-0057')
    await user.click(screen.getByRole('button', { name: 'Voltar para auditoria' }))
    await screen.findByRole('table', { name: 'Histórico de operações nas campanhas' })
    expect(window.location.pathname).toBe('/auditoria')
    expect(screen.getByRole('textbox', { name: 'Buscar por campanha, código ou responsável' })).toHaveValue('rascunho da busca')
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('Exibindo 3 de 10 registros')
  })

  it('volta pela breadcrumb em acesso direto sem contexto prévio', async () => {
    const user = await setup()
    await user.click(within(screen.getByRole('navigation', { name: 'Caminho' })).getByRole('link', { name: 'Auditoria' }))
    await screen.findByRole('table', { name: 'Histórico de operações nas campanhas' })
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('de 80 registros')
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('preserva a página usando o Voltar nativo do navegador', async () => {
    window.history.replaceState(null, '', '/auditoria')
    render(<App />)
    await screen.findByRole('table')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    await openRow(user, 'AUD-0008')
    act(() => { window.history.back() })
    await screen.findByRole('table', { name: 'Histórico de operações nas campanhas' })
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('mostra loading e mantém a exportação desabilitada até resolver o ID', async () => {
    let resolve!: (record: AuditRecord | undefined) => void
    const loadRecord = vi.fn(() => new Promise<AuditRecord | undefined>(done => { resolve = done }))
    render(<AuditOperationDetailsPage operationId="audit-1" loadRecord={loadRecord} />)
    expect(screen.getByText('Carregando operação…')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Exportar evento' })).toBeDisabled()
    await act(async () => { await Promise.resolve(); resolve(auditRecords[0]) })
    expect(loadRecord).toHaveBeenCalledWith('audit-1')
    expect(screen.getByRole('table', { name: 'Informações da operação AUD-0001' })).toBeVisible()
  })

  it('trata falha de carregamento e recupera com Tentar novamente', async () => {
    const loadRecord = vi.fn().mockRejectedValueOnce(new Error('Falha local')).mockResolvedValueOnce(auditRecords[0])
    render(<AuditOperationDetailsPage operationId="audit-1" loadRecord={loadRecord} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a operação')
    expect(screen.getByRole('button', { name: 'Exportar evento' })).toBeDisabled()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('table', { name: 'Informações da operação AUD-0001' })).toBeVisible()
    expect(loadRecord).toHaveBeenCalledTimes(2)
  })

  it.each(['inexistente', '%E0%A4%A'])('trata ID %s sem cair no login e permite voltar', async id => {
    window.history.replaceState(null, '', `/auditoria/${id}`)
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Operação não encontrada' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Exportar evento' })).toBeDisabled()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Voltar para auditoria' }))
    expect(await screen.findByRole('table', { name: 'Histórico de operações nas campanhas' })).toBeVisible()
  })

  it('ignora resposta antiga quando o identificador muda durante o carregamento', async () => {
    const resolvers = new Map<string, (record: AuditRecord) => void>()
    const loadRecord = (id: string) => new Promise<AuditRecord>(resolve => { resolvers.set(id, resolve) })
    const view = render(<AuditOperationDetailsPage operationId="audit-1" loadRecord={loadRecord} />)
    await act(async () => { await Promise.resolve() })
    view.rerender(<AuditOperationDetailsPage operationId="audit-2" loadRecord={loadRecord} />)
    await act(async () => { await Promise.resolve(); resolvers.get('audit-2')!(auditRecords[1]) })
    await act(async () => { resolvers.get('audit-1')!(auditRecords[0]) })
    await waitFor(() => expect(screen.getByRole('table', { name: 'Informações da operação AUD-0002' })).toBeVisible())
    expect(screen.queryByRole('table', { name: 'Informações da operação AUD-0001' })).not.toBeInTheDocument()
  })

  it('o repositório por ID retorna a mesma fonte e undefined para ID ausente', async () => {
    expect(await loadAuditRecord('audit-1')).toBe(auditRecords[0])
    expect(await loadAuditRecord('não existe')).toBeUndefined()
  })
})
