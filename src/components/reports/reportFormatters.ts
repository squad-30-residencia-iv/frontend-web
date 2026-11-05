import type { ReportCatalog, ReportData, ReportFilters, ReportStatus } from '../../types/report'

export const emptyValue = '—'

export const statusLabels: Record<ReportStatus, string> = {
  redeemed: 'Utilizados',
  available: 'Disponíveis',
  expired: 'Expirados',
  cancelled: 'Cancelados',
}

const integerFormat = new Intl.NumberFormat('pt-BR')
const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCount(value: number): string {
  return integerFormat.format(value)
}

/** Recebe o percentual 0-100; null (sem emitidos) vira "—". */
export function formatPercent(value: number | null, fractionDigits = 1): string {
  if (value === null) return emptyValue
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}%`
}

export function formatCurrency(value: number | null): string {
  return value === null ? emptyValue : currencyFormat.format(value).replace(/ /g, ' ')
}

// Evita que o Excel interprete texto como fórmula (=, +, -, @) e escapa aspas e separadores.
function csvText(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const csvNumber = (value: number | null, fractionDigits = 0) => value === null
  ? ''
  : value.toLocaleString('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits, useGrouping: false })

function filterLabel(options: readonly { value: string; label: string }[], value: string, fallback: string) {
  return options.find(option => option.value === value)?.label ?? fallback
}

/** CSV em pt-BR (separador ";", decimal ","), com os filtros aplicados no topo. */
export function buildReportCsv(data: ReportData, filters: ReportFilters, catalog: ReportCatalog): string {
  const rows: string[][] = [
    ['Relatório de vouchers'],
    ['Filtro', 'Valor'],
    ['Período', filterLabel(catalog.periods, filters.period, filters.period)],
    ['Campanha', filterLabel(catalog.campaigns, filters.campaign, 'Todas')],
    ['Categoria', filterLabel(catalog.categories, filters.category, 'Todas')],
    ['Rede', filterLabel(catalog.networks, filters.network, 'Todas')],
    ['Região', filterLabel(catalog.regions, filters.region, 'Todas')],
    ['Estabelecimento', filterLabel(catalog.establishments, filters.establishment, 'Todos')],
    ['Tipo de cliente', filterLabel(catalog.customerTypes, filters.customerType, 'Todos')],
    [],
    ['Indicadores', 'Valor'],
    ['Vouchers emitidos', csvNumber(data.kpis.issued)],
    ['Vouchers resgatados', csvNumber(data.kpis.redeemed)],
    ['Vouchers expirados e não utilizados', csvNumber(data.kpis.expired)],
    ['Vouchers ainda disponíveis', csvNumber(data.kpis.available)],
    ['Vouchers cancelados', csvNumber(data.kpis.cancelled)],
    ['Taxa de utilização (%)', csvNumber(data.kpis.utilizationRate, 1)],
    [],
    ['Mês', 'Emitidos', 'Resgatados', 'Expirados'],
    ...data.monthly.map(item => [item.month, csvNumber(item.issued), csvNumber(item.redeemed), csvNumber(item.expired)]),
    [],
    ['Campanha', 'Emitidos', 'Resgatados', 'Taxa (%)'],
    ...data.topCampaigns.map(item => [item.name, csvNumber(item.issued), csvNumber(item.redeemed), csvNumber(item.rate, 1)]),
    [],
    ['Região', 'Vouchers', 'Utilização (%)', 'Ticket médio (R$)'],
    ...data.regions.map(item => [item.name, csvNumber(item.vouchers), csvNumber(item.rate, 1), csvNumber(item.averageTicket, 2)]),
  ]
  return rows.map(row => row.map(csvText).join(';')).join('\r\n')
}

export const reportCsvFilename = 'relatorio-vouchers.csv'

/** Baixa o CSV com BOM UTF-8, para o Excel abrir acentos corretamente. */
export function downloadCsv(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
