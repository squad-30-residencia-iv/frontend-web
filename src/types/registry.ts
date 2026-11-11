/** Canais de uma loja, no formato da API. */
export type StoreChannel = 'Physical' | 'Virtual'

export const storeChannels: readonly StoreChannel[] = ['Physical', 'Virtual']

/** Cadastros que o administrador mantém na tela /cadastros. */
export type RegistryEntity = 'network' | 'region' | 'store' | 'category' | 'product'

export interface RegistryNetwork {
  id: string
  name: string
  timeZone: string
  isActive: boolean
}

export interface RegistryRegion {
  id: string
  networkId: string
  name: string
  isActive: boolean
}

export interface RegistryStore {
  id: string
  regionId: string
  code: string
  name: string
  channels: StoreChannel[]
  isActive: boolean
}

export interface RegistryCategory {
  id: string
  name: string
  isActive: boolean
}

export interface RegistryProduct {
  id: string
  categoryId: string
  code: string
  name: string
  isActive: boolean
}

/** Valores do formulário. Campos que a entidade não usa ficam vazios. */
export interface RegistryFormValues {
  name: string
  code: string
  timeZone: string
  channels: StoreChannel[]
}

/** Linha exibida numa coluna de cadastro, com os valores para editar ou reativar. */
export interface RegistryRow {
  id: string
  name: string
  detail: string
  isActive: boolean
  values: RegistryFormValues
}
