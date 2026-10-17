import { createFormSchema, formErrors } from '../schemas/validation'
import type { CampaignChannel, CampaignDraft } from '../types/campaign'

export interface CampaignStore {
  id: string
  code: string
  name: string
}

// Catálogo local demonstrativo; substituir pelo serviço de lojas na integração.
export const campaignStores: readonly CampaignStore[] = [
  { id: 'store-center', code: '001', name: 'Loja Centro' },
  { id: 'store-shopping', code: '002', name: 'Loja Shopping' },
  { id: 'store-online', code: '003', name: 'Loja Online' },
]

export function newCampaignScope(): CampaignDraft['scope'] {
  return {
    mode: 'stores',
    networkChannels: [],
    storeIds: [],
    storeChannels: [],
  }
}

export type CampaignScopeErrors = Partial<Record<'stores' | 'networkChannels' | 'storeChannels', string>>

function collectCampaignScopeErrors(scope: CampaignDraft['scope']): CampaignScopeErrors {
  const errors: CampaignScopeErrors = {}

  if (scope.mode === 'network') {
    if (!scope.networkChannels.length) {
      errors.networkChannels = 'Selecione ao menos um canal para toda a rede.'
    }
    return errors
  }

  const hasValidStores = scope.storeIds.length > 0
    && scope.storeIds.every(id => campaignStores.some(store => store.id === id))

  if (!hasValidStores) {
    errors.stores = 'Adicione ao menos uma loja específica.'
  }
  if (!scope.storeChannels.length) {
    errors.storeChannels = 'Selecione ao menos um canal para as lojas específicas.'
  }

  return errors
}

function isChannel(value: unknown): value is CampaignChannel {
  return value === 'physical' || value === 'virtual'
}

export function isCampaignScope(value: unknown): value is CampaignDraft['scope'] {
  if (!value || typeof value !== 'object') return false

  const scope = value as Record<string, unknown>

  return (scope.mode === 'network' || scope.mode === 'stores')
    && Array.isArray(scope.networkChannels)
    && scope.networkChannels.every(isChannel)
    && Array.isArray(scope.storeChannels)
    && scope.storeChannels.every(isChannel)
    && Array.isArray(scope.storeIds)
    && scope.storeIds.every(id => typeof id === 'string')
}

export const campaignScopeSchema = createFormSchema(isCampaignScope, collectCampaignScopeErrors)

export function validateCampaignScope(value: CampaignDraft['scope']): CampaignScopeErrors {
  return formErrors(campaignScopeSchema, value)
}
