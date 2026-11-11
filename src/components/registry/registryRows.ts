import type {
  RegistryCategory,
  RegistryNetwork,
  RegistryProduct,
  RegistryRegion,
  RegistryRow,
  RegistryStore,
} from '../../types/registry'
import { channelsText, emptyFormValues } from './registryCopy'

export function networkRow(network: RegistryNetwork): RegistryRow {
  return {
    id: network.id,
    name: network.name,
    isActive: network.isActive,
    detail: network.timeZone ? `Fuso ${network.timeZone}` : '',
    values: { ...emptyFormValues, name: network.name, timeZone: network.timeZone },
  }
}

export function regionRow(region: RegistryRegion): RegistryRow {
  return {
    id: region.id,
    name: region.name,
    isActive: region.isActive,
    detail: '',
    values: { ...emptyFormValues, name: region.name },
  }
}

export function storeRow(store: RegistryStore): RegistryRow {
  const channels = store.channels.length > 0 ? channelsText(store.channels) : 'Sem canal'
  return {
    id: store.id,
    name: store.name,
    isActive: store.isActive,
    detail: `Código ${store.code} · ${channels}`,
    values: { ...emptyFormValues, name: store.name, code: store.code, channels: store.channels },
  }
}

export function categoryRow(category: RegistryCategory): RegistryRow {
  return {
    id: category.id,
    name: category.name,
    isActive: category.isActive,
    detail: '',
    values: { ...emptyFormValues, name: category.name },
  }
}

export function productRow(product: RegistryProduct): RegistryRow {
  return {
    id: product.id,
    name: product.name,
    isActive: product.isActive,
    detail: `Código ${product.code}`,
    values: { ...emptyFormValues, name: product.name, code: product.code },
  }
}
