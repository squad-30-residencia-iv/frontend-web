import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { VoucherLookupPage } from './VoucherLookupPage'
import { App } from '../App'
import { emptyVoucherFilters, filterVouchers, vouchers } from '../data/vouchers'
import type { Voucher } from '../types/voucher'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterEach(() => { window.history.replaceState(null, '', '/'); vi.restoreAllMocks() })
afterAll(() => vi.unstubAllGlobals())

async function setup() {
  const user = userEvent.setup()
  render(<VoucherLookupPage />)
  await screen.findByRole('table')
  return user
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: RegExp, option: string) {
  await user.click(screen.getByRole('button', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('Consulta de Vouchers', () => {
  it('renderiza a rota, cabeçalho com subtítulo, sidebar ativa e sete linhas mascaradas', async () => {
    window.history.replaceState(null, '', '/vouchers')
    render(<App />)
    expect(await screen.findByRole('table')).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Consulta de Vouchers' })).toBeVisible()
    expect(screen.getByText('Consulte os vouchers emitidos e acompanhe seus respectivos status e movimentações')).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Vouchers' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('row')).toHaveLength(8)
    expect(screen.getByText('***.482.***-10')).toBeVisible()
    expect(screen.getByText('Exibindo', { exact: false })).toHaveTextContent('Exibindo 7 de 5.899 vouchers')
    expect(screen.queryByRole('button', { name: 'Nova campanha' })).not.toBeInTheDocument()
  })

  it('calcula cards do conjunto completo e não os altera ao filtrar', async () => {
    const user = await setup()
    const summary = screen.getByRole('region', { name: 'Resumo de vouchers' })
    for (const total of ['1.284', '3.567', '892', '156']) expect(within(summary).getByText(total)).toBeVisible()
    await user.type(screen.getByRole('textbox', { name: 'Buscar por código ou cliente' }), '8F2A91')
    expect(screen.getAllByRole('row')).toHaveLength(8)
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(within(summary).getByText('1.284')).toBeVisible()
  })

  it('busca por cliente e identificação mascarada e limpa os filtros', async () => {
    const user = await setup()
    const input = screen.getByRole('textbox', { name: 'Buscar por código ou cliente' })
    fireEvent.change(input, { target: { value: 'Cliente demonstrativo 1' } })
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getByRole('rowheader', { name: 'VCH-8F2A91' })).toBeVisible()
    expect(screen.queryByRole('rowheader', { name: 'VCH-3D7B44' })).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '915' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Filtros de vouchers' }))
    expect(screen.getByRole('rowheader', { name: 'VCH-3D7B44' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('5.899')
  })

  it('combina campanha e status e redefine a página', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    await selectOption(user, /Campanha:/, 'Black Friday 2024')
    await selectOption(user, /Status:/, 'Utilizado')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    const rows = screen.getAllByRole('row').slice(1)
    for (const row of rows) {
      expect(row).toHaveTextContent('Black Friday 2024')
      expect(row).toHaveTextContent('Utilizado')
    }
  })

  it('aplica período de emissão e oferece limpar no estado sem resultados', async () => {
    const user = await setup()
    await selectOption(user, /Período de emissão:/, 'Últimos 30 dias')
    await user.type(screen.getByRole('textbox', { name: 'Buscar por código ou cliente' }), 'não existe')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getByRole('heading', { name: 'Nenhum voucher encontrado' })).toBeVisible()
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('Exibindo 0 de 0 vouchers')
    await user.click(within(screen.getByRole('region', { name: 'Vouchers emitidos' })).getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getByRole('table')).toBeVisible()
  })

  it('navega até a última página parcial e retorna', async () => {
    const user = await setup()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página 843' }))
    expect(screen.getAllByRole('row')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
    expect(screen.getByText(/Exibindo/)).toHaveTextContent('Exibindo 5 de 5.899 vouchers')
    await user.click(screen.getByRole('button', { name: 'Página 1' }))
    expect(screen.getByRole('rowheader', { name: 'VCH-8F2A91' })).toBeVisible()
  })

  it('mostra carregando até o carregador local resolver e aceita conjunto vazio', async () => {
    let resolve!: (items: readonly Voucher[]) => void
    const loadItems = () => new Promise<readonly Voucher[]>(done => { resolve = done })
    render(<VoucherLookupPage loadItems={loadItems} />)
    expect(screen.getByText('Carregando vouchers…')).toBeVisible()
    await act(async () => { await Promise.resolve(); resolve([]) })
    expect(screen.getByText('Ainda não há vouchers emitidos.')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('mostra erro e permite tentar novamente com sucesso', async () => {
    const user = userEvent.setup()
    const loadItems = vi.fn().mockRejectedValueOnce(new Error('Falha local')).mockResolvedValueOnce(vouchers)
    render(<VoucherLookupPage loadItems={loadItems} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os vouchers')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('table')).toBeVisible()
    expect(loadItems).toHaveBeenCalledTimes(2)
  })

  it('abre ações por teclado e navega ao destino do histórico sem cair no login', async () => {
    window.history.replaceState(null, '', '/vouchers')
    const user = userEvent.setup()
    render(<App />)
    const trigger = await screen.findByRole('button', { name: 'Ações de VCH-8F2A91' })
    trigger.focus()
    await user.keyboard('{Enter}')
    const history = await screen.findByRole('menuitem', { name: 'Ver histórico' })
    await user.click(history)
    expect(window.location.pathname).toBe('/vouchers/voucher-1/historico')
    expect(screen.getByRole('heading', { name: 'Histórico ainda não disponível' })).toBeVisible()
  })
})

it('filtra períodos por datas locais inclusivas, excluindo emissões futuras', () => {
  const items = ['2026-10-01', '2026-10-30', '2026-10-31', '2026-09-30'].map((issuedAt, index) => ({ ...vouchers[0], id: String(index), issuedAt }))
  expect(filterVouchers(items, { ...emptyVoucherFilters, period: '30' }, new Date(2026, 9, 30)).map(item => item.id)).toEqual(['0', '1'])
})
