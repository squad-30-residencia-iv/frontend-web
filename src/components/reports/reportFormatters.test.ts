import { describe, expect, it } from 'vitest'
import { buildReport, reportCatalog } from '../../data/reports'
import { defaultReportFilters } from '../../data/reportFilters'
import { buildReportCsv, formatCount, formatCurrency, formatPercent } from './reportFormatters'

describe('formatadores de relatório', () => {
  it('formata contagem, percentual e moeda em pt-BR', () => {
    expect(formatCount(5899)).toBe('5.899')
    expect(formatPercent(60.4679)).toBe('60,5%')
    expect(formatPercent(88.2, 0)).toBe('88%')
    expect(formatPercent(null)).toBe('—')
    expect(formatCurrency(195.2)).toBe('R$ 195,20')
    expect(formatCurrency(null)).toBe('—')
  })
})

describe('CSV do relatório', () => {
  const csv = buildReportCsv(buildReport(defaultReportFilters), defaultReportFilters, reportCatalog)

  it('usa ";" e vírgula decimal, com filtros e indicadores', () => {
    const lines = csv.split('\r\n')
    expect(lines).toContain('Período;Últimos 30 dias')
    expect(lines).toContain('Vouchers emitidos;5899')
    expect(lines).toContain('Taxa de utilização (%);60,5')
    expect(lines).toContain('Black Friday 2024;' + lines.find(line => line.startsWith('Black Friday 2024'))!.split(';').slice(1).join(';'))
    expect(csv).not.toContain('NaN')
  })

  it('deixa a taxa vazia quando não há emitidos', () => {
    const empty = buildReportCsv(buildReport({ ...defaultReportFilters, network: 'franchise', region: 'north' }), defaultReportFilters, reportCatalog)
    expect(empty.split('\r\n')).toContain('Taxa de utilização (%);')
  })

  it('neutraliza fórmulas e escapa aspas e separadores', () => {
    const data = buildReport(defaultReportFilters)
    const tricky = { ...data, topCampaigns: [{ campaignId: 'x', name: '=SOMA(1;2) "a"', issued: 1, redeemed: 1, rate: 100 }] }
    expect(buildReportCsv(tricky, defaultReportFilters, reportCatalog)).toContain(`"'=SOMA(1;2) ""a""";1;1;100,0`)
  })
})
