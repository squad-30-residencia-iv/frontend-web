export type VoucherStatus = 'available' | 'used' | 'expired' | 'cancelled'

export interface Voucher {
  id: string
  code: string
  campaignId: string
  campaignName: string
  clientName: string
  clientIdentification: string // Somente identificação já mascarada, nunca CPF completo.
  issuedAt: string
  expiresAt: string
  uses: number
  usageLimit: number
  status: VoucherStatus
}

export interface VoucherFilters {
  search: string
  campaign: string
  status: string
  period: string
}
