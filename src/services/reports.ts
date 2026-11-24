import { api } from './api'
import type { ReportCatalog, ReportData, ReportFilters, ReportPeriod } from '../types/report'

interface ApiOverview {
  kpis: {
    issued: number
    redeemed: number
    expired: number
    available: number
    cancelled: number
    utilizationRate: number | null
  }
  monthly: Array<{ month: string; issued: number; redeemed: number; expired: number }>
  statusDistribution: Array<{ status: string; count: number }>
  topCampaigns: Array<{ campaignId: string; name: string; issued: number; redeemed: number; rate: number | null }>
  regions: Array<{ regionId: string; name: string; vouchers: number; rate: number | null; averageTicket: number | null }>
}

interface ApiCatalog {
  campaigns: Array<{ value: string; label: string }>
  regions: Array<{ value: string; label: string }>
  establishments: Array<{ value: string; label: string; regionId: string }>
}

function periodParam(period: ReportPeriod): string {
  return period
}

export async function fetchReportCatalogFromApi(networkId: string): Promise<ReportCatalog> {
  const { data } = await api.get<ApiCatalog>('/api/v1/reports/catalog', { params: { networkId } })
  return {
    periods: [
      { value: '30d', label: 'Últimos 30 dias' },
      { value: '90d', label: 'Últimos 90 dias' },
      { value: '6m', label: 'Últimos 6 meses' },
    ],
    campaigns: [
      { value: 'all', label: 'Todas as campanhas' },
      ...data.campaigns.map(item => ({ value: item.value, label: item.label })),
    ],
    categories: [{ value: 'all', label: 'Todas as categorias' }],
    networks: [{ value: networkId, label: 'Rede da sessão' }],
    regions: [
      { value: 'all', label: 'Todas as regiões', networkIds: [networkId] },
      ...data.regions.map(item => ({ value: item.value, label: item.label, networkIds: [networkId] as const })),
    ],
    establishments: [
      { value: 'all', label: 'Todos os estabelecimentos', networkId, regionId: 'all' },
      ...data.establishments.map(item => ({
        value: item.value,
        label: item.label,
        networkId,
        regionId: item.regionId,
      })),
    ],
    customerTypes: [{ value: 'all', label: 'Todos os clientes' }],
  }
}

export async function fetchReportFromApi(networkId: string, filters: ReportFilters): Promise<ReportData> {
  const { data } = await api.get<ApiOverview>('/api/v1/reports/overview', {
    params: {
      networkId,
      period: periodParam(filters.period),
      campaignId: filters.campaign !== 'all' ? filters.campaign : undefined,
      regionId: filters.region !== 'all' ? filters.region : undefined,
      establishmentId: filters.establishment !== 'all' ? filters.establishment : undefined,
    },
  })

  const statusMap = {
    redeemed: 'redeemed',
    available: 'available',
    expired: 'expired',
    cancelled: 'cancelled',
  } as const

  return {
    kpis: {
      issued: data.kpis.issued,
      redeemed: data.kpis.redeemed,
      expired: data.kpis.expired,
      available: data.kpis.available,
      cancelled: data.kpis.cancelled,
      utilizationRate: data.kpis.utilizationRate,
    },
    monthly: data.monthly,
    statusDistribution: data.statusDistribution.flatMap(slice => {
      const status = statusMap[slice.status as keyof typeof statusMap]
      return status ? [{ status, count: slice.count }] : []
    }),
    topCampaigns: data.topCampaigns.map(row => ({
      campaignId: row.campaignId,
      name: row.name,
      issued: row.issued,
      redeemed: row.redeemed,
      rate: row.rate,
    })),
    regions: data.regions.map(row => ({
      regionId: row.regionId,
      name: row.name,
      vouchers: row.vouchers,
      rate: row.rate,
      averageTicket: row.averageTicket,
    })),
  }
}
