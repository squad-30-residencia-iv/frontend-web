import { api } from './api'
import type { Voucher, VoucherStatus } from '../types/voucher'
import type { VoucherEvent, VoucherEventType, VoucherHistory } from '../types/voucherHistory'

interface ApiPortalVoucher {
  id: string
  code: string
  campaignId: string
  campaignName: string
  customerName: string | null
  customerDocumentMasked: string
  issuedAt: string
  validUntil: string
  usesCount: number
  maxUses: number
  status: string
}

interface ApiPortalVoucherDetail {
  voucher: ApiPortalVoucher
  benefit: string
  scope: ReadonlyArray<{ label: string; value: string }>
  events: ReadonlyArray<{
    id: string
    type: string
    occurredAt: string
    origin: string
    place: string
    result: string
  }>
}

const statusMap: Record<string, VoucherStatus> = {
  Available: 'available',
  Redeemed: 'used',
  Expired: 'expired',
  Cancelled: 'cancelled',
  Provisional: 'available',
}

const eventMap: Record<string, VoucherEventType> = {
  Issued: 'issued',
  Confirmed: 'validated',
  Redeemed: 'redeemed',
  Expired: 'expired',
  Cancelled: 'cancelled',
  ReservationExpired: 'cancelled',
  RedemptionReversed: 'validated',
}

function toLocalDate(iso: string): string {
  return iso.slice(0, 10)
}

function toLocalDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapVoucher(item: ApiPortalVoucher): Voucher {
  return {
    id: item.id,
    code: item.code,
    campaignId: item.campaignId,
    campaignName: item.campaignName,
    clientName: item.customerName?.trim() || 'Cliente',
    clientIdentification: item.customerDocumentMasked,
    issuedAt: toLocalDate(item.issuedAt),
    expiresAt: toLocalDate(item.validUntil),
    uses: item.usesCount,
    usageLimit: item.maxUses,
    status: statusMap[item.status] ?? 'available',
  }
}

function mapEvent(entry: ApiPortalVoucherDetail['events'][number]): VoucherEvent {
  return {
    id: entry.id,
    type: eventMap[entry.type] ?? 'validated',
    occurredAt: toLocalDateTime(entry.occurredAt),
    origin: entry.origin,
    place: entry.place,
    result: entry.result,
  }
}

/** Lista vouchers da rede para o portal. Sem rede, devolve vazio. */
export async function fetchNetworkVouchers(networkId: string | null): Promise<readonly Voucher[]> {
  if (!networkId) return []
  const { data } = await api.get<ApiPortalVoucher[]>('/api/v1/vouchers', { params: { networkId } })
  return Array.isArray(data) ? data.map(mapVoucher) : []
}

/** Histórico completo de um voucher. */
export async function fetchVoucherHistory(voucherId: string): Promise<VoucherHistory | null> {
  try {
    const { data } = await api.get<ApiPortalVoucherDetail>(`/api/v1/vouchers/${voucherId}`)
    return {
      voucher: mapVoucher(data.voucher),
      benefit: data.benefit,
      scope: data.scope.map(item => ({ label: item.label, value: item.value })),
      events: data.events.map(mapEvent),
    }
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) return null
    }
    throw error
  }
}
