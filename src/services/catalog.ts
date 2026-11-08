import { api } from './api'
import type { CampaignStore } from '../data/campaignScope'

export interface CatalogOption {
  value: string
  label: string
}

export interface PortalCatalog {
  categories: CatalogOption[]
  products: CatalogOption[]
  stores: CampaignStore[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readOption(value: unknown, labelOf: (record: Record<string, unknown>) => string | null): CatalogOption | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null
  const label = labelOf(value)
  return label ? { value: value.id, label } : null
}

async function readList(url: string, params: Record<string, string | boolean>, labelOf: (record: Record<string, unknown>) => string | null) {
  const { data } = await api.get<unknown>(url, { params })
  if (!Array.isArray(data)) throw new Error('Resposta inesperada do servidor.')
  return data.map(item => readOption(item, labelOf)).filter((item): item is CatalogOption => item !== null)
}

export async function fetchActiveCategories(): Promise<CatalogOption[]> {
  return readList('/api/v1/categories', { activeOnly: true }, record => typeof record.name === 'string' ? record.name : null)
}

export async function fetchActiveProducts(): Promise<CatalogOption[]> {
  return readList('/api/v1/products', { activeOnly: true }, record => {
    if (typeof record.name !== 'string') return null
    return typeof record.code === 'string' ? `${record.code} — ${record.name}` : record.name
  })
}

export async function fetchNetworkStores(networkId: string): Promise<CampaignStore[]> {
  const { data } = await api.get<unknown>('/api/v1/regions', { params: { networkId, activeOnly: true } })
  if (!Array.isArray(data)) throw new Error('Resposta inesperada do servidor.')

  const regionIds = data.flatMap(region => isRecord(region) && typeof region.id === 'string' ? [region.id] : [])
  const lists = await Promise.all(regionIds.map(async regionId => {
    const response = await api.get<unknown>('/api/v1/establishments', { params: { regionId, activeOnly: true } })
    return Array.isArray(response.data) ? response.data : []
  }))

  return lists.flat().flatMap(store => {
    if (!isRecord(store) || typeof store.id !== 'string' || typeof store.name !== 'string') return []
    return [{ id: store.id, code: typeof store.code === 'string' ? store.code : '', name: store.name }]
  })
}

export async function loadPortalCatalog(networkId: string): Promise<PortalCatalog> {
  const [categories, products, stores] = await Promise.all([
    fetchActiveCategories(),
    fetchActiveProducts(),
    fetchNetworkStores(networkId),
  ])
  return { categories, products, stores }
}
