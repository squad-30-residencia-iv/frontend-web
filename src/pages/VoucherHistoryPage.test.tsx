import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { getVoucherHistory, referenceVoucherId } from '../data/voucherHistory'
import { vouchers } from '../data/vouchers'
import type { VoucherHistory } from '../types/voucherHistory'
import { VoucherHistoryPage } from './VoucherHistoryPage'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterEach(() => window.history.replaceState(null, '', '/'))
afterAll(() => vi.unstubAllGlobals())

async function setup(voucherId = referenceVoucherId) {
  const user = userEvent.setup()
  render(<VoucherHistoryPage voucherId={voucherId} />)
  await screen.findByRole('table', { name: 'Resumo' })
  return user
}

const timelineRowHeaders = () => within(screen.getByRole('table', { name: 'Linha do tempo das movimentações' }))
  .getAllByRole('rowheader').map(header => header.textContent)

describe('Histórico do voucher', () => {
  it('mostra cabeçalho com subtítulo, caminho, sidebar ativa e resumo do voucher', async () => {
    await setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico do voucher' })).toBeVisible()
    expect(screen.getByText('Consulte os eventos de emissão, utilização, expiração e cancelamento.')).toBeVisible()
    const path = screen.getByRole('navigation', { name: 'Caminho' })
    expect(within(path).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Portal', 'Vouchers', 'Histórico'])
    expect(within(path).getByRole('link', { name: 'Vouchers' })).toHaveAttribute('href', '/vouchers')
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Vouchers' })).toHaveAttribute('aria-current', 'page')

    const summary = screen.getByRole('table', { name: 'Resumo' })
    expect(within(summary).getAllByRole('columnheader').map(header => header.textContent)).toEqual([
      'Código', 'Campanha de origem', 'Cliente', 'Data de emissão', 'Validade', 'Usos', 'Status', 'Benefício',
    ])
    expect(within(summary).getAllByRole('row')).toHaveLength(2)
    const row = within(summary).getAllByRole('row')[1]
    for (const text of ['VCH-8F2A91', 'Volta às Aulas', '***.482.***-10', '10/09/2026', '10/10/2026', '0/1', 'Disponível', '10% de desconto']) {
      expect(row).toHaveTextContent(text)
    }
  })

  it('mostra o escopo e as regras de utilização', async () => {
    await setup()
    expect(screen.getByRole('heading', { name: 'Escopo e Regras de utilização' })).toBeVisible()
    expect(screen.getByText('Onde o voucher pode ser utilizado:')).toBeVisible()
    for (const line of [
      'Rede: Supermercados Norte.',
      'Região: Nordeste.',
      'Estabelecimento: Todas as lojas vinculadas.',
      'Canal: Físico e virtual.',
      'Alvo: Categoria Papelaria.',
      'Limite: Uma utilização por cliente.',
    ]) {
      expect(screen.getByText(line)).toBeVisible()
    }
  })

  it('mostra a linha do tempo com tipo, data, origem, local e resultado', async () => {
    await setup()
    const timeline = screen.getByRole('table', { name: 'Linha do tempo das movimentações' })
    expect(within(timeline).getAllByRole('columnheader').map(header => header.textContent)).toEqual([
      'Movimentação', 'Data/Hora', 'Origem', 'Canal/Local', 'Resultado',
    ])
    expect(timelineRowHeaders()).toEqual(['Emissão', 'Validação', 'Resgate'])
    const [, issued, validated, redeemed] = within(timeline).getAllByRole('row')
    for (const text of ['20/11 às 14h30', 'Aplicativo', 'Canal virtual', 'Analista']) expect(issued).toHaveTextContent(text)
    for (const text of ['01/05 às 17h03', 'PDV', 'Loja Centro', 'Gestor']) expect(validated).toHaveTextContent(text)
    for (const text of ['10/01 às 13h40', 'PDV', 'Loja Centro', 'Analista']) expect(redeemed).toHaveTextContent(text)
  })

  it.each([
    ['voucher-2', 'VCH-3D7B44', 'Utilizado', '1/1', ['Resgate', 'Validação', 'Emissão']],
    ['voucher-3', 'VCH-6E1C09', 'Expirado', '0/1', ['Expiração', 'Emissão']],
    ['voucher-5', 'VCH-2B8E35', 'Cancelado', '0/1', ['Cancelamento', 'Emissão']],
    ['voucher-6', 'VCH-5C3D18', 'Disponível', '0/2', ['Emissão']],
  ])('monta o histórico de %s (%s) coerente com o status', async (id, code, status, uses, events) => {
    await setup(id)
    const row = within(screen.getByRole('table', { name: 'Resumo' })).getAllByRole('row')[1]
    expect(row).toHaveTextContent(code)
    expect(row).toHaveTextContent(status)
    expect(row).toHaveTextContent(uses)
    expect(timelineRowHeaders()).toEqual(events)
  })

  it('entrega os eventos do mais recente ao mais antigo para todos os exemplos', () => {
    for (const voucher of vouchers.slice(0, 7)) {
      const dates = getVoucherHistory(voucher.id)!.events.map(event => event.occurredAt)
      expect(dates).toEqual([...dates].sort().reverse())
    }
  })

  it('o botão de voltar e o caminho levam para a consulta de vouchers', async () => {
    const user = await setup()
    await user.click(screen.getByRole('button', { name: 'Voltar para vouchers' }))
    expect(window.location.pathname).toBe('/vouchers')
    window.history.replaceState(null, '', '/')
    await user.click(within(screen.getByRole('navigation', { name: 'Caminho' })).getByRole('link', { name: 'Vouchers' }))
    expect(window.location.pathname).toBe('/vouchers')
  })

  it('voucher inexistente mostra o estado de não encontrado e volta para a consulta', async () => {
    const user = userEvent.setup()
    render(<VoucherHistoryPage voucherId="inexistente" />)
    expect(await screen.findByRole('heading', { name: 'Voucher não encontrado' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico do voucher' })).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar para vouchers' }))
    expect(window.location.pathname).toBe('/vouchers')
  })

  it('mostra carregando enquanto o carregador não resolve', () => {
    render(<VoucherHistoryPage voucherId={referenceVoucherId} loadHistory={() => new Promise<VoucherHistory | null>(() => {})} />)
    expect(screen.getByText('Carregando histórico do voucher…')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('mostra erro e permite tentar novamente com sucesso', async () => {
    const user = userEvent.setup()
    const loadHistory = vi.fn().mockRejectedValueOnce(new Error('Falha local')).mockResolvedValueOnce(getVoucherHistory(referenceVoucherId))
    render(<VoucherHistoryPage voucherId={referenceVoucherId} loadHistory={loadHistory} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o histórico')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('table', { name: 'Resumo' })).toBeVisible()
    expect(loadHistory).toHaveBeenCalledTimes(2)
  })

  it('o App resolve /vouchers/:id/historico', async () => {
    window.history.replaceState(null, '', '/vouchers/voucher-2/historico')
    render(<App />)
    expect(await screen.findByRole('table', { name: 'Resumo' })).toHaveTextContent('VCH-3D7B44')
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico do voucher' })).toBeVisible()
  })
})