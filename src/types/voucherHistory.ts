import type { Voucher } from './voucher'

export type VoucherEventType = 'issued' | 'validated' | 'redeemed' | 'expired' | 'cancelled'

export const voucherEventLabels: Record<VoucherEventType, string> = {
  issued: 'Emissão',
  validated: 'Validação',
  redeemed: 'Resgate',
  expired: 'Expiração',
  cancelled: 'Cancelamento',
}

export interface VoucherScopeItem {
  label: string
  value: string
}

export interface VoucherEvent {
  id: string
  type: VoucherEventType
  /** Data e hora locais no formato aaaa-mm-ddThh:mm. */
  occurredAt: string
  origin: string
  place: string
  result: string
}

export interface VoucherHistory {
  voucher: Voucher
  benefit: string
  scope: VoucherScopeItem[]
  events: VoucherEvent[]
}
