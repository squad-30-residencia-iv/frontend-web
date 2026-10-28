export type ReportPeriod = '30d' | '90d' | '6m'

export interface ReportFilters {
  period: ReportPeriod
  campaign: string
  category: string
  network: string
  region: string
  establishment: string
  customerType: string
}

export interface ReportOption {
  value: string
  label: string
}

export interface ReportCatalog {
  periods: readonly ReportOption[]
  campaigns: readonly ReportOption[]
  categories: readonly ReportOption[]
  networks: readonly ReportOption[]
  regions: readonly (ReportOption & { networkIds: readonly string[] })[]
  establishments: readonly (ReportOption & { networkId: string; regionId: string })[]
  customerTypes: readonly ReportOption[]
}

export interface ReportKpis {
  issued: number
  redeemed: number
  expired: number
  available: number
  cancelled: number
  /** Percentual 0-100 (resgatados ÷ emitidos); null quando não há emitidos. */
  utilizationRate: number | null
}

export interface ReportMonthlyPoint {
  month: string
  issued: number
  redeemed: number
  expired: number
}

export type ReportStatus = 'redeemed' | 'available' | 'expired' | 'cancelled'

export interface ReportStatusSlice {
  status: ReportStatus
  count: number
}

export interface ReportCampaignRow {
  campaignId: string
  name: string
  issued: number
  redeemed: number
  rate: number | null
}

export interface ReportRegionRow {
  regionId: string
  name: string
  vouchers: number
  rate: number | null
  /** Ticket médio em reais (mock); null quando não há resgates. */
  averageTicket: number | null
}

export interface ReportData {
  kpis: ReportKpis
  monthly: readonly ReportMonthlyPoint[]
  statusDistribution: readonly ReportStatusSlice[]
  topCampaigns: readonly ReportCampaignRow[]
  regions: readonly ReportRegionRow[]
}
