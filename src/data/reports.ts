import { reportDataSchema } from '../schemas/reportSchema'
import { calculateUtilizationRate } from './reportMetrics'
import { allValue } from './reportFilters'
import type {
  ReportCatalog, ReportData, ReportFilters, ReportOption, ReportStatus,
} from '../types/report'

// Mock da tela de Relatórios. Ponto único de troca pelas chamadas HTTP quando o contrato da API existir.
// Os totais do período padrão reproduzem a imagem de referência (5.899 emitidos, 3.567 resgatados,
// 892 expirados, 1.284 disponíveis e 156 cancelados). As tabelas são derivadas do mesmo conjunto,
// por isso seus números diferem dos da imagem, que não fecham com os cards.

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'] as const
const periodMonths = { '30d': 1, '90d': 3, '6m': 6 } as const

const campaignDefs = [
  { id: 'black-friday', name: 'Black Friday 2024', categoryId: 'electronics', share: 24, rate: 0.9 },
  { id: 'dia-das-maes', name: 'Dia das Mães', categoryId: 'beauty', share: 14, rate: 0.82 },
  { id: 'volta-as-aulas', name: 'Volta às Aulas', categoryId: 'fashion', share: 10, rate: 0.74 },
  { id: 'natal-premiado', name: 'Natal Premiado', categoryId: 'home', share: 22, rate: 0.64 },
  { id: 'aniversario-loja', name: 'Aniversário da Loja', categoryId: 'supermarket', share: 18, rate: 0.56 },
  { id: 'liquidacao-verao', name: 'Liquidação de Verão', categoryId: 'fashion', share: 7, rate: 0.3 },
  { id: 'semana-consumidor', name: 'Semana do Consumidor', categoryId: 'supermarket', share: 5, rate: 0.25 },
] as const

const regionDefs = [
  { id: 'southeast', rateFactor: 1.15, name: 'Sudeste', weight: 2477, ticket: 195.2 },
  { id: 'south', rateFactor: 1.05, name: 'Sul', weight: 1234, ticket: 189.4 },
  { id: 'northeast', rateFactor: 0.95, name: 'Nordeste', weight: 943, ticket: 174.1 },
  { id: 'midwest', rateFactor: 0.85, name: 'Centro-Oeste', weight: 712, ticket: 182.3 },
  { id: 'north', rateFactor: 0.7, name: 'Norte', weight: 533, ticket: 168.9 },
] as const

const networkDefs = [
  { id: 'own', name: 'Lojas próprias' },
  { id: 'franchise', name: 'Franquias' },
] as const

// Franquias não atuam no Norte: torna a cascata Rede → Região → Estabelecimento observável.
const establishmentDefs = [
  { id: 'own-sp', name: 'Loja São Paulo Centro', networkId: 'own', regionId: 'southeast', split: 0.6 },
  { id: 'fr-campinas', name: 'Franquia Campinas', networkId: 'franchise', regionId: 'southeast', split: 0.4 },
  { id: 'own-cwb', name: 'Loja Curitiba Centro', networkId: 'own', regionId: 'south', split: 0.6 },
  { id: 'fr-poa', name: 'Franquia Porto Alegre', networkId: 'franchise', regionId: 'south', split: 0.4 },
  { id: 'own-ssa', name: 'Loja Salvador Shopping', networkId: 'own', regionId: 'northeast', split: 0.6 },
  { id: 'fr-rec', name: 'Franquia Recife', networkId: 'franchise', regionId: 'northeast', split: 0.4 },
  { id: 'own-gyn', name: 'Loja Goiânia Centro', networkId: 'own', regionId: 'midwest', split: 0.6 },
  { id: 'fr-bsb', name: 'Franquia Brasília', networkId: 'franchise', regionId: 'midwest', split: 0.4 },
  { id: 'own-mao', name: 'Loja Manaus Centro', networkId: 'own', regionId: 'north', split: 1 },
] as const

const customerTypeDefs = [
  { id: 'new', name: 'Novo', share: 30 },
  { id: 'recurring', name: 'Recorrente', share: 45 },
  { id: 'loyalty', name: 'Fidelidade', share: 25 },
] as const

const categoryOptions: readonly ReportOption[] = [
  { value: 'supermarket', label: 'Supermercado' },
  { value: 'electronics', label: 'Eletro' },
  { value: 'fashion', label: 'Moda' },
  { value: 'home', label: 'Casa' },
  { value: 'beauty', label: 'Beleza' },
]

export const reportCatalog: ReportCatalog = {
  periods: [
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '6m', label: 'Últimos 6 meses' },
  ],
  campaigns: campaignDefs.map(({ id, name }) => ({ value: id, label: name })),
  categories: categoryOptions,
  networks: networkDefs.map(({ id, name }) => ({ value: id, label: name })),
  regions: regionDefs.map(({ id, name }) => ({
    value: id,
    label: name,
    networkIds: [...new Set(establishmentDefs.filter(item => item.regionId === id).map(item => item.networkId))],
  })),
  establishments: establishmentDefs.map(({ id, name, networkId, regionId }) => ({ value: id, label: name, networkId, regionId })),
  customerTypes: customerTypeDefs.map(({ id, name }) => ({ value: id, label: name })),
}

interface Fact {
  month: number
  campaignId: string
  categoryId: string
  networkId: string
  regionId: string
  establishmentId: string
  customerTypeId: string
  counts: Record<ReportStatus, number>
}

/** Distribui um total inteiro por pesos (maiores restos), preservando a soma exata. */
export function allocate(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((acc, weight) => acc + weight, 0)
  const raw = weights.map(weight => (total * weight) / sum)
  const result = raw.map(Math.floor)
  const remaining = total - result.reduce((acc, value) => acc + value, 0)
  const order = raw.map((value, index) => ({ index, fraction: value - result[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (let step = 0; step < remaining; step += 1) result[order[step].index] += 1
  return result
}

// Totais por mês. Junho (último) é exatamente o período padrão da imagem.
const monthlyIssued = [3480, 3820, 4310, 4890, 5120, 5899]
const monthlyRedeemRate = [0.58, 0.59, 0.6, 0.605, 0.6, 3567 / 5899]
const monthlyExpiredRate = [0.15, 0.16, 0.15, 0.15, 0.155, 892 / 5899]
const monthlyCancelledRate = [0.03, 0.03, 0.03, 0.03, 0.03, 156 / 5899]

function monthStatusTotals(monthIndex: number): Record<ReportStatus, number> {
  if (monthIndex === months.length - 1) return { redeemed: 3567, expired: 892, available: 1284, cancelled: 156 }
  const issued = monthlyIssued[monthIndex]
  const redeemed = Math.round(issued * monthlyRedeemRate[monthIndex])
  const expired = Math.round(issued * monthlyExpiredRate[monthIndex])
  const cancelled = Math.round(issued * monthlyCancelledRate[monthIndex])
  return { redeemed, expired, cancelled, available: issued - redeemed - expired - cancelled }
}

function createFacts(): readonly Fact[] {
  const leaves = campaignDefs.flatMap(campaign => establishmentDefs.flatMap(establishment => customerTypeDefs.map(customer => {
    const region = regionDefs.find(item => item.id === establishment.regionId)!
    const base = campaign.share * region.weight * establishment.split * customer.share
    return { campaign, establishment, customer, base, regionFactor: region.rateFactor }
  })))
  const statusWeights: Record<ReportStatus, (leaf: (typeof leaves)[number]) => number> = {
    redeemed: leaf => leaf.base * leaf.campaign.rate * leaf.regionFactor,
    expired: leaf => leaf.base * (1 - leaf.campaign.rate) * 0.6,
    available: leaf => leaf.base * (1 - leaf.campaign.rate) * 0.4,
    cancelled: leaf => leaf.base * 0.03,
  }
  const statuses = Object.keys(statusWeights) as ReportStatus[]
  const facts: Fact[] = []
  months.forEach((_, month) => {
    const totals = monthStatusTotals(month)
    const perStatus = Object.fromEntries(statuses.map(status => [
      status, allocate(totals[status], leaves.map(statusWeights[status])),
    ])) as Record<ReportStatus, number[]>
    leaves.forEach((leaf, index) => {
      facts.push({
        month,
        campaignId: leaf.campaign.id,
        categoryId: leaf.campaign.categoryId,
        networkId: leaf.establishment.networkId,
        regionId: leaf.establishment.regionId,
        establishmentId: leaf.establishment.id,
        customerTypeId: leaf.customer.id,
        counts: {
          redeemed: perStatus.redeemed[index], expired: perStatus.expired[index],
          available: perStatus.available[index], cancelled: perStatus.cancelled[index],
        },
      })
    })
  })
  return facts
}

const facts = createFacts()

const sumCounts = (items: readonly Fact[]): Record<ReportStatus, number> => items.reduce(
  (acc, fact) => ({
    redeemed: acc.redeemed + fact.counts.redeemed,
    expired: acc.expired + fact.counts.expired,
    available: acc.available + fact.counts.available,
    cancelled: acc.cancelled + fact.counts.cancelled,
  }),
  { redeemed: 0, expired: 0, available: 0, cancelled: 0 },
)
const issuedOf = (counts: Record<ReportStatus, number>) => counts.redeemed + counts.expired + counts.available + counts.cancelled

const matches = (value: string, filter: string) => filter === allValue || value === filter

/** Agrega o mock aplicando os filtros por AND. Sem resultado devolve visão zerada. */
export function buildReport(filters: ReportFilters): ReportData {
  const filtered = facts.filter(fact => matches(fact.campaignId, filters.campaign)
    && matches(fact.categoryId, filters.category)
    && matches(fact.networkId, filters.network)
    && matches(fact.regionId, filters.region)
    && matches(fact.establishmentId, filters.establishment)
    && matches(fact.customerTypeId, filters.customerType))
  // O gráfico mensal mostra sempre a série completa; só o Período não o restringe.
  const monthly = months.map((month, index) => {
    const counts = sumCounts(filtered.filter(fact => fact.month === index))
    return { month, issued: issuedOf(counts), redeemed: counts.redeemed, expired: counts.expired }
  })
  const firstMonth = months.length - periodMonths[filters.period]
  const inPeriod = filtered.filter(fact => fact.month >= firstMonth)
  const totals = sumCounts(inPeriod)
  const issued = issuedOf(totals)

  const topCampaigns = campaignDefs.map(campaign => {
    const counts = sumCounts(inPeriod.filter(fact => fact.campaignId === campaign.id))
    const campaignIssued = issuedOf(counts)
    return {
      campaignId: campaign.id, name: campaign.name, issued: campaignIssued,
      redeemed: counts.redeemed, rate: calculateUtilizationRate(counts.redeemed, campaignIssued),
    }
  })
    .filter(row => row.issued > 0)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.issued - a.issued)
    .slice(0, 5)

  const regions = regionDefs.map(region => {
    const counts = sumCounts(inPeriod.filter(fact => fact.regionId === region.id))
    const vouchers = issuedOf(counts)
    return {
      regionId: region.id, name: region.name, vouchers,
      rate: calculateUtilizationRate(counts.redeemed, vouchers),
      averageTicket: counts.redeemed > 0 ? region.ticket : null,
    }
  }).filter(row => row.vouchers > 0).sort((a, b) => b.vouchers - a.vouchers)

  return reportDataSchema.parse({
    kpis: { issued, ...totals, utilizationRate: calculateUtilizationRate(totals.redeemed, issued) },
    monthly,
    statusDistribution: [
      { status: 'redeemed', count: totals.redeemed },
      { status: 'available', count: totals.available },
      { status: 'expired', count: totals.expired },
      { status: 'cancelled', count: totals.cancelled },
    ],
    topCampaigns,
    regions,
  })
}

export function fetchReportCatalog(): Promise<ReportCatalog> {
  return Promise.resolve(reportCatalog)
}

export function fetchReport(filters: ReportFilters): Promise<ReportData> {
  return Promise.resolve().then(() => buildReport(filters))
}
