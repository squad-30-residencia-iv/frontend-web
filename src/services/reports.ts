import { z } from 'zod'
import axios from 'axios'
import { api } from './api'
import { toProblemError } from './problemDetails'
import { reportPeriodSchema } from '../schemas/reportSchema'
import type { ReportCatalog, ReportData, ReportFilters } from '../types/report'

const count = z.number().int().nonnegative().default(0)
const rate = z.number().min(0).max(100).nullable().default(null)
const list = <T extends z.ZodType>(schema: T) => z.preprocess(value => value ?? [], z.array(schema))
const option = z.object({ value: z.string().uuid(), label: z.string().min(1) })
const catalogSchema = z.object({
  campaigns: list(option), regions: list(option),
  establishments: list(option.extend({ regionId: z.string().uuid() })),
})
const kpisSchema = z.object({ issued: count, redeemed: count, expired: count, available: count, cancelled: count, utilizationRate: rate })
const overviewSchema = z.object({
  kpis: z.preprocess(value => value ?? {}, kpisSchema),
  monthly: list(z.object({ month: z.string(), issued: count, redeemed: count, expired: count })),
  statusDistribution: list(z.object({ status: z.string(), count })),
  topCampaigns: list(z.object({ campaignId: z.string().uuid(), name: z.string(), issued: count, redeemed: count, rate })),
  regions: list(z.object({ regionId: z.string().uuid(), name: z.string(), vouchers: count, rate, averageTicket: z.number().nonnegative().nullable().default(null) })),
})

export const reportPeriods = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '6m', label: 'Últimos 6 meses' },
] as const

export function emptyReportCatalog(): ReportCatalog {
  return { periods: reportPeriods, campaigns: [], regions: [], establishments: [], categories: [], networks: [], customerTypes: [],
    supportedFilters: ['period', 'campaign', 'region', 'establishment'] }
}

export function emptyReportData(): ReportData {
  return { kpis: { issued: 0, redeemed: 0, expired: 0, available: 0, cancelled: 0, utilizationRate: null },
    monthly: [], statusDistribution: [], topCampaigns: [], regions: [] }
}

function validNetwork(networkId: string) {
  if (!z.string().uuid().safeParse(networkId).success) throw new Error('A sessão não possui uma rede válida para consultar os relatórios.')
}

function reportError(error: unknown, message: string): Error {
  if (axios.isCancel(error)) throw error
  if (error instanceof z.ZodError) return new Error('A API retornou um formato de relatório inválido. Tente novamente.')
  return toProblemError(error, message)
}

export async function fetchReportCatalogFromApi(networkId: string, signal?: AbortSignal): Promise<ReportCatalog> {
  validNetwork(networkId)
  try {
    const response = await api.get<unknown>('/api/v1/reports/catalog', { params: { networkId }, signal, timeout: 15000 })
    const data = catalogSchema.parse(response.data ?? {})
    return { ...emptyReportCatalog(), campaigns: data.campaigns,
      regions: data.regions.map(item => ({ ...item, networkIds: [networkId] })),
      establishments: data.establishments.map(item => ({ ...item, networkId })) }
  } catch (error) { throw reportError(error, 'Não foi possível carregar os filtros do relatório.') }
}

export async function fetchReportFromApi(networkId: string, filters: ReportFilters, signal?: AbortSignal): Promise<ReportData> {
  validNetwork(networkId)
  const id = (value: string) => z.string().uuid().safeParse(value).success ? value : undefined
  try {
    const response = await api.get<unknown>('/api/v1/reports/overview', {
      params: { networkId, period: reportPeriodSchema.safeParse(filters.period).success ? filters.period : '30d',
        campaignId: id(filters.campaign), regionId: id(filters.region), establishmentId: id(filters.establishment) },
      signal, timeout: 15000,
    })
    const data = overviewSchema.parse(response.data ?? {})
    const statuses = ['redeemed', 'available', 'expired', 'cancelled'] as const
    return { ...data, statusDistribution: statuses.map(status => ({ status,
      count: data.statusDistribution.filter(slice => slice.status === status).reduce((total, slice) => total + slice.count, 0) })) }
  } catch (error) { throw reportError(error, 'Não foi possível carregar os indicadores do relatório.') }
}
