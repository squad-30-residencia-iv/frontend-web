import type { Voucher } from '../types/voucher'
import type { VoucherEvent, VoucherEventType, VoucherHistory, VoucherScopeItem } from '../types/voucherHistory'
import { vouchers } from './vouchers'

/** Voucher do protótipo (VCH-8F2A91): o histórico dele usa os valores ilustrativos do Figma. */
export const referenceVoucherId = 'voucher-1'

function createEvent(type: VoucherEventType, occurredAt: string, origin: string, place: string, result: string): VoucherEvent {
  return { id: type, type, occurredAt, origin, place, result }
}

const referenceHistory = {
  benefit: '10% de desconto',
  scope: [
    { label: 'Rede', value: 'Supermercados Norte' },
    { label: 'Região', value: 'Nordeste' },
    { label: 'Estabelecimento', value: 'Todas as lojas vinculadas' },
    { label: 'Canal', value: 'Físico e virtual' },
    { label: 'Alvo', value: 'Categoria Papelaria' },
    { label: 'Limite', value: 'Uma utilização por cliente' },
  ] satisfies VoucherScopeItem[],
  events: [
    createEvent('issued', '2026-11-20T14:30', 'Aplicativo', 'Canal virtual', 'Analista'),
    createEvent('validated', '2026-05-01T17:03', 'PDV', 'Loja Centro', 'Gestor'),
    createEvent('redeemed', '2026-01-10T13:40', 'PDV', 'Loja Centro', 'Analista'),
  ],
}

// Para os demais vouchers da Consulta, o histórico é demonstrativo e coerente com o status e as datas do voucher.
function deriveEvents(voucher: Voucher): VoucherEvent[] {
  const events = [createEvent('issued', `${voucher.issuedAt}T14:30`, 'Aplicativo', 'Canal virtual', 'Analista')]
  if (voucher.status === 'used') {
    events.push(createEvent('validated', `${voucher.expiresAt}T17:03`, 'PDV', 'Loja Centro', 'Gestor'))
    events.push(createEvent('redeemed', `${voucher.expiresAt}T17:10`, 'PDV', 'Loja Centro', 'Analista'))
  }
  if (voucher.status === 'expired') {
    events.push(createEvent('expired', `${voucher.expiresAt}T23:59`, 'Sistema', 'Automático', 'Sistema'))
  }
  if (voucher.status === 'cancelled') {
    events.push(createEvent('cancelled', `${voucher.issuedAt}T16:20`, 'Portal', 'Backoffice', 'Gestor'))
  }
  return events
}

function deriveScope(voucher: Voucher): VoucherScopeItem[] {
  return [
    { label: 'Rede', value: 'Supermercados Norte' },
    { label: 'Região', value: 'Nordeste' },
    { label: 'Estabelecimento', value: 'Todas as lojas vinculadas' },
    { label: 'Canal', value: 'Físico e virtual' },
    { label: 'Alvo', value: `Campanha ${voucher.campaignName}` },
    { label: 'Limite', value: voucher.usageLimit === 1 ? 'Uma utilização por cliente' : `${voucher.usageLimit} utilizações por cliente` },
  ]
}

export function getVoucherHistory(voucherId: string): VoucherHistory | null {
  const voucher = vouchers.find(item => item.id === voucherId)
  if (!voucher) return null
  const reference = voucher.id === referenceVoucherId ? referenceHistory : undefined
  const events = reference?.events ?? deriveEvents(voucher)
  return {
    voucher,
    benefit: reference?.benefit ?? 'Não informado',
    scope: reference?.scope ?? deriveScope(voucher),
    // Eventos do mais recente ao mais antigo.
    events: [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  }
}

// Carregador local injetável, no mesmo padrão da Consulta; sem requisição ou atraso artificial.
// É o ponto único de troca por uma API.
export function loadVoucherHistory(voucherId: string): Promise<VoucherHistory | null> {
  return Promise.resolve(getVoucherHistory(voucherId))
}