import { describe, expect, it } from 'vitest'
import { allocate, buildReport, reportCatalog } from './reports'
import { calculateUtilizationRate } from './reportMetrics'
import {
  areDefaultFilters, defaultReportFilters, establishmentOptions, normalizeReportFilters, parseReportFilters,
  regionOptions, serializeReportFilters,
} from './reportFilters'
import { reportDataSchema, reportKpisSchema } from '../schemas/reportSchema'

describe('taxa de utilização', () => {
  it('divide resgatados por emitidos e retorna null sem emitidos', () => {
    expect(calculateUtilizationRate(50, 200)).toBe(25)
    expect(calculateUtilizationRate(0, 0)).toBeNull()
    expect(calculateUtilizationRate(5, 0)).toBeNull()
  })
})

describe('allocate', () => {
  it('preserva a soma exata e respeita os pesos', () => {
    const result = allocate(100, [1, 1, 1])
    expect(result.reduce((a, b) => a + b, 0)).toBe(100)
    expect(allocate(10, [3, 1])).toEqual([8, 2])
  })
})

describe('mock do relatório', () => {
  it('reproduz os indicadores do período padrão e fecha a conta com cancelados', () => {
    const { kpis } = buildReport(defaultReportFilters)
    expect(kpis).toMatchObject({ issued: 5899, redeemed: 3567, expired: 892, available: 1284, cancelled: 156 })
    expect(kpis.issued).toBe(kpis.redeemed + kpis.expired + kpis.available + kpis.cancelled)
    expect(kpis.utilizationRate).toBeCloseTo(60.5, 1)
  })

  it('mantém a série mensal completa e soma a rosca ao total', () => {
    const data = buildReport(defaultReportFilters)
    expect(data.monthly.map(point => point.month)).toEqual(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'])
    expect(data.statusDistribution.reduce((sum, slice) => sum + slice.count, 0)).toBe(5899)
    expect(data.monthly[5].issued).toBe(5899)
  })

  it('amplia o período e não restringe o gráfico mensal', () => {
    const quarter = buildReport({ ...defaultReportFilters, period: '90d' })
    const half = buildReport({ ...defaultReportFilters, period: '6m' })
    const thirty = buildReport(defaultReportFilters)
    expect(quarter.kpis.issued).toBe(4890 + 5120 + 5899)
    expect(half.kpis.issued).toBeGreaterThan(quarter.kpis.issued)
    expect(quarter.monthly).toEqual(thirty.monthly)
  })

  it('combina filtros por AND e as tabelas respeitam o recorte', () => {
    const one = buildReport({ ...defaultReportFilters, campaign: 'black-friday' })
    expect(one.kpis.issued).toBeGreaterThan(0)
    expect(one.kpis.issued).toBeLessThan(5899)
    expect(one.topCampaigns).toHaveLength(1)
    const narrowed = buildReport({ ...defaultReportFilters, campaign: 'black-friday', region: 'north' })
    expect(narrowed.kpis.issued).toBeLessThan(one.kpis.issued)
    expect(narrowed.regions.map(row => row.name)).toEqual(['Norte'])
  })

  it('ordena as campanhas por taxa e limita a cinco', () => {
    const { topCampaigns } = buildReport(defaultReportFilters)
    expect(topCampaigns).toHaveLength(5)
    expect(topCampaigns[0].name).toBe('Black Friday 2024')
    const rates = topCampaigns.map(row => row.rate ?? 0)
    expect(rates).toEqual([...rates].sort((a, b) => b - a))
  })

  it('devolve visão zerada, sem erro, quando nenhum registro combina', () => {
    const data = buildReport({ ...defaultReportFilters, network: 'franchise', region: 'north' })
    expect(data.kpis).toEqual({ issued: 0, redeemed: 0, expired: 0, available: 0, cancelled: 0, utilizationRate: null })
    expect(data.topCampaigns).toEqual([])
    expect(data.regions).toEqual([])
  })

  it('valida a resposta com o schema Zod', () => {
    expect(reportKpisSchema.safeParse({ issued: 10, redeemed: 1, expired: 1, available: 1, cancelled: 1, utilizationRate: 10 }).success).toBe(false)
    expect(reportDataSchema.safeParse(buildReport(defaultReportFilters)).success).toBe(true)
  })
})

describe('filtros e URL', () => {
  it('faz a cascata Rede → Região → Estabelecimento', () => {
    expect(regionOptions(reportCatalog, 'franchise').map(option => option.value)).not.toContain('north')
    expect(regionOptions(reportCatalog, 'all')).toHaveLength(5)
    expect(establishmentOptions(reportCatalog, 'own', 'south').map(option => option.value)).toEqual(['own-cwb'])
    const normalized = normalizeReportFilters(reportCatalog, { ...defaultReportFilters, network: 'franchise', region: 'north' })
    expect(normalized.region).toBe('all')
  })

  it('lê filtros válidos da URL e ignora valores inválidos', () => {
    const parsed = parseReportFilters('?periodo=90d&campanha=black-friday&rede=xyz&regiao=south&cliente=loyalty&categoria=nada&periodo2=1', reportCatalog)
    expect(parsed).toEqual({ ...defaultReportFilters, period: '90d', campaign: 'black-friday', region: 'south', customerType: 'loyalty' })
    expect(parseReportFilters('?periodo=1y', reportCatalog).period).toBe('30d')
    expect(parseReportFilters('?rede=franchise&regiao=north&estabelecimento=own-sp', reportCatalog)).toEqual({ ...defaultReportFilters, network: 'franchise' })
  })

  it('serializa somente o que difere do padrão', () => {
    expect(serializeReportFilters(defaultReportFilters)).toBe('')
    expect(serializeReportFilters({ ...defaultReportFilters, period: '6m', network: 'own' })).toBe('?periodo=6m&rede=own')
    expect(areDefaultFilters(defaultReportFilters)).toBe(true)
    expect(areDefaultFilters({ ...defaultReportFilters, region: 'south' })).toBe(false)
  })
})
