import { api } from './api'
import { toProblemError } from './problemDetails'
import {
  storeChannels,
  type RegistryCategory,
  type RegistryEntity,
  type RegistryFormValues,
  type RegistryNetwork,
  type RegistryProduct,
  type RegistryRegion,
  type RegistryStore,
  type StoreChannel,
} from '../types/registry'

const resourcePaths: Record<RegistryEntity, string> = {
  network: '/api/v1/networks',
  region: '/api/v1/regions',
  store: '/api/v1/establishments',
  category: '/api/v1/categories',
  product: '/api/v1/products',
}

const genericLoadMessage = 'Não foi possível carregar a lista. Tente novamente.'
const genericSaveMessage = 'Não foi possível gravar o cadastro. Tente novamente.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStoreChannel(value: unknown): value is StoreChannel {
  return typeof value === 'string' && (storeChannels as readonly string[]).includes(value)
}

/** Base comum: sem id, nome ou status, o item é descartado. */
function readBase(value: unknown) {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.isActive !== 'boolean') {
    return null
  }
  return { record: value, id: value.id, name: value.name, isActive: value.isActive }
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function readNetwork(value: unknown): RegistryNetwork | null {
  const base = readBase(value)
  if (!base) return null
  return { id: base.id, name: base.name, isActive: base.isActive, timeZone: readString(base.record, 'timeZone') }
}

function readRegion(value: unknown): RegistryRegion | null {
  const base = readBase(value)
  if (!base) return null
  return { id: base.id, name: base.name, isActive: base.isActive, networkId: readString(base.record, 'networkId') }
}

function readStore(value: unknown): RegistryStore | null {
  const base = readBase(value)
  if (!base) return null
  const channels = Array.isArray(base.record.channels) ? base.record.channels.filter(isStoreChannel) : []
  return {
    id: base.id,
    name: base.name,
    isActive: base.isActive,
    regionId: readString(base.record, 'regionId'),
    code: readString(base.record, 'code'),
    channels: storeChannels.filter(channel => channels.includes(channel)),
  }
}

function readCategory(value: unknown): RegistryCategory | null {
  const base = readBase(value)
  if (!base) return null
  return { id: base.id, name: base.name, isActive: base.isActive }
}

function readProduct(value: unknown): RegistryProduct | null {
  const base = readBase(value)
  if (!base) return null
  return {
    id: base.id,
    name: base.name,
    isActive: base.isActive,
    categoryId: readString(base.record, 'categoryId'),
    code: readString(base.record, 'code'),
  }
}

/** Lista ativos e inativos: sem `activeOnly`, a API devolve todos. */
async function readList<T>(entity: RegistryEntity, params: Record<string, string>, read: (value: unknown) => T | null): Promise<T[]> {
  try {
    const { data } = await api.get<unknown>(resourcePaths[entity], { params })
    if (!Array.isArray(data)) throw new Error(genericLoadMessage)
    return data.map(read).filter((item): item is T => item !== null)
  } catch (error) {
    throw toProblemError(error, genericLoadMessage)
  }
}

export function fetchNetworks(): Promise<RegistryNetwork[]> {
  return readList('network', {}, readNetwork)
}

export function fetchRegions(networkId: string): Promise<RegistryRegion[]> {
  return readList('region', { networkId }, readRegion)
}

export function fetchStores(regionId: string): Promise<RegistryStore[]> {
  return readList('store', { regionId }, readStore)
}

export function fetchCategories(): Promise<RegistryCategory[]> {
  return readList('category', {}, readCategory)
}

export function fetchProducts(categoryId: string): Promise<RegistryProduct[]> {
  return readList('product', { categoryId }, readProduct)
}

function createBody(entity: RegistryEntity, values: RegistryFormValues, parentId: string | null) {
  const name = values.name.trim()
  const code = values.code.trim()
  switch (entity) {
    case 'network': return { name, timeZone: values.timeZone.trim() }
    case 'region': return { networkId: parentId, name }
    case 'store': return { regionId: parentId, code, name, channels: values.channels }
    case 'category': return { name }
    case 'product': return { categoryId: parentId, code, name }
  }
}

function updateBody(entity: RegistryEntity, values: RegistryFormValues, isActive: boolean) {
  const name = values.name.trim()
  const code = values.code.trim()
  switch (entity) {
    case 'network': return { name, timeZone: values.timeZone.trim(), isActive }
    case 'region': return { name, isActive }
    case 'store': return { code, name, isActive, channels: values.channels }
    case 'category': return { name, isActive }
    case 'product': return { code, name, isActive }
  }
}

async function send(request: () => Promise<unknown>) {
  try {
    await request()
  } catch (error) {
    throw toProblemError(error, genericSaveMessage)
  }
}

/** Cria o cadastro. Região, loja e produto levam o id do pai. O corpo da resposta não é lido: a tela recarrega a lista. */
export function createRegistryItem(entity: RegistryEntity, values: RegistryFormValues, parentId: string | null): Promise<void> {
  return send(() => api.post(resourcePaths[entity], createBody(entity, values, parentId)))
}

/**
 * Altera o cadastro. Use `isActive: true` para reativar.
 * A tela não envia `false`: inativar passa só por `deactivateRegistryItem`, com confirmação da cascata.
 */
export function updateRegistryItem(entity: RegistryEntity, id: string, values: RegistryFormValues, isActive: boolean): Promise<void> {
  return send(() => api.put(`${resourcePaths[entity]}/${id}`, updateBody(entity, values, isActive)))
}

/** Inativa o cadastro. Rede, região e categoria levam os filhos junto. */
export function deactivateRegistryItem(entity: RegistryEntity, id: string): Promise<void> {
  return send(() => api.delete(`${resourcePaths[entity]}/${id}`))
}
