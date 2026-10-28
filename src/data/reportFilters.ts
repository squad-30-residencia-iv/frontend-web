import { reportPeriodSchema } from '../schemas/reportSchema'
import type { ReportCatalog, ReportFilters, ReportOption } from '../types/report'

export const allValue = 'all'

export const defaultReportFilters: ReportFilters = {
  period: '30d',
  campaign: allValue,
  category: allValue,
  network: allValue,
  region: allValue,
  establishment: allValue,
  customerType: allValue,
}

const paramNames: Record<keyof ReportFilters, string> = {
  period: 'periodo',
  campaign: 'campanha',
  category: 'categoria',
  network: 'rede',
  region: 'regiao',
  establishment: 'estabelecimento',
  customerType: 'cliente',
}

const filterKeys = Object.keys(paramNames) as (keyof ReportFilters)[]

export function regionOptions(catalog: ReportCatalog, networkId: string): readonly ReportOption[] {
  return catalog.regions
    .filter(region => networkId === allValue || region.networkIds.includes(networkId))
    .map(({ value, label }) => ({ value, label }))
}

export function establishmentOptions(catalog: ReportCatalog, networkId: string, regionId: string): readonly ReportOption[] {
  return catalog.establishments
    .filter(item => (networkId === allValue || item.networkId === networkId) && (regionId === allValue || item.regionId === regionId))
    .map(({ value, label }) => ({ value, label }))
}

const isKnown = (options: readonly ReportOption[], value: string) => value === allValue || options.some(option => option.value === value)

/** Descarta valores inexistentes no catálogo e combinações incompatíveis da cascata Rede → Região → Estabelecimento. */
export function normalizeReportFilters(catalog: ReportCatalog, filters: ReportFilters): ReportFilters {
  const result: ReportFilters = { ...filters }
  if (!reportPeriodSchema.safeParse(result.period).success) result.period = defaultReportFilters.period
  if (!isKnown(catalog.campaigns, result.campaign)) result.campaign = allValue
  if (!isKnown(catalog.categories, result.category)) result.category = allValue
  if (!isKnown(catalog.networks, result.network)) result.network = allValue
  if (!isKnown(catalog.customerTypes, result.customerType)) result.customerType = allValue
  if (!isKnown(regionOptions(catalog, result.network), result.region)) result.region = allValue
  if (!isKnown(establishmentOptions(catalog, result.network, result.region), result.establishment)) result.establishment = allValue
  return result
}

export function parseReportFilters(search: string, catalog: ReportCatalog): ReportFilters {
  const params = new URLSearchParams(search)
  const raw: ReportFilters = { ...defaultReportFilters }
  for (const key of filterKeys) {
    const value = params.get(paramNames[key])
    if (value) (raw as unknown as Record<string, string>)[key] = value
  }
  return normalizeReportFilters(catalog, raw)
}

/** Query string só com o que difere do padrão ("" quando tudo é padrão). */
export function serializeReportFilters(filters: ReportFilters): string {
  const params = new URLSearchParams()
  for (const key of filterKeys) {
    if (filters[key] !== defaultReportFilters[key]) params.set(paramNames[key], filters[key])
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function areDefaultFilters(filters: ReportFilters): boolean {
  return filterKeys.every(key => filters[key] === defaultReportFilters[key])
}
