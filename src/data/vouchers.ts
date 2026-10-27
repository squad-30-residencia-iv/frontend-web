import type { Voucher, VoucherFilters, VoucherStatus } from '../types/voucher'

export const voucherStatusLabels: Record<VoucherStatus, string> = {
  available: 'Disponível', used: 'Utilizado', expired: 'Expirado', cancelled: 'Cancelado',
}

export const emptyVoucherFilters: VoucherFilters = { search: '', campaign: 'all', status: 'all', period: 'all' }

const examples = [
  ['8F2A91', 'Volta às Aulas', '482', '10', '2026-09-10', '2026-10-10', 'available'],
  ['3D7B44', 'Black Friday 2024', '915', '88', '2024-11-15', '2024-11-30', 'used'],
  ['6E1C09', 'Natal Premiado', '203', '55', '2024-12-01', '2024-12-25', 'expired'],
  ['9A4F72', 'Dia das Mães', '671', '33', '2024-05-01', '2024-05-12', 'used'],
  ['2B8E35', 'Liquidação de Verão', '148', '92', '2024-01-05', '2024-01-25', 'cancelled'],
  ['5C3D18', 'Aniversário da Loja', '527', '41', '2024-09-15', '2024-09-30', 'available'],
  ['7F6A23', 'Semana do Consumidor', '834', '67', '2024-03-10', '2024-03-17', 'used'],
] as const

const firstVouchers: Voucher[] = examples.map(([code, name, middle, end, issuedAt, expiresAt, status], index) => ({
  id: `voucher-${index + 1}`, code: `VCH-${code}`, campaignId: `campaign-${index + 1}`,
  campaignName: name, clientName: `Cliente demonstrativo ${index + 1}`,
  clientIdentification: `***.${middle}.***-${end}`, issuedAt, expiresAt,
  uses: status === 'used' ? 1 : 0, usageLimit: index === 5 ? 2 : 1, status,
}))

function createMockVouchers(): readonly Voucher[] {
  const result = [...firstVouchers]
  const totals: Record<VoucherStatus, number> = { available: 1284, used: 3567, expired: 892, cancelled: 156 }
  for (const status of Object.keys(totals) as VoucherStatus[]) {
    const remaining = totals[status] - firstVouchers.filter(voucher => voucher.status === status).length
    for (let index = 0; index < remaining; index += 1) {
      const number = result.length + 1
      const source = firstVouchers[index % firstVouchers.length]
      result.push({
        ...source, id: `voucher-${number}`, code: `VCH-DEMO${String(number).padStart(5, '0')}`,
        clientName: `Cliente demonstrativo ${number}`, status,
        uses: status === 'used' ? source.usageLimit : 0,
      })
    }
  }
  return result
}

export const vouchers = createMockVouchers()

// Carregador local injetável, seguindo o padrão da Home; sem requisição ou atraso artificial.
export function loadVouchers(): Promise<readonly Voucher[]> {
  return Promise.resolve(vouchers)
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function filterVouchers(items: readonly Voucher[], filters: VoucherFilters, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(today)
  if (filters.period !== 'all') start.setDate(start.getDate() - Number(filters.period) + 1)
  const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const query = normalize(filters.search)
  return items.filter(voucher => {
    const matchesSearch = [voucher.code, voucher.clientName, voucher.clientIdentification].some(value => normalize(value).includes(query))
    const matchesPeriod = filters.period === 'all' || (voucher.issuedAt >= localDate(start) && voucher.issuedAt <= localDate(today))
    return matchesSearch && matchesPeriod
      && (filters.campaign === 'all' || voucher.campaignId === filters.campaign)
      && (filters.status === 'all' || voucher.status === filters.status)
  })
}
