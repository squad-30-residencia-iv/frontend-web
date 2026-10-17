import { z } from 'zod'
import { campaignSchema } from '../schemas/campaignSchema'
import { campaignDraftStorageKey } from './campaignDraft'
import { campaignStores } from './campaignScope'
import type { Campaign, CampaignDraft } from '../types/campaign'

export const createdCampaignsStorageKey = 'portal-campaigns:created:v1'
const storedCampaignsSchema = z.array(z.object({
  id: z.string().min(1),
  draft: campaignSchema,
}))

function readCreatedCampaigns() {
  const stored = localStorage.getItem(createdCampaignsStorageKey)
  if (!stored) return []
  // Não sobrescrever silenciosamente registros corrompidos ao criar uma campanha.
  return storedCampaignsSchema.parse(JSON.parse(stored))
}

export function loadCreatedCampaigns(): Campaign[] {
  try {
    return readCreatedCampaigns().map(({ id, draft }) => ({
      id,
      name: draft.information.name.trim(),
      start: draft.information.start.slice(0, 10),
      end: draft.information.end.slice(0, 10),
      scope: draft.scope.mode === 'network' ? 'Toda a rede' : draft.scope.storeIds
        .map(storeId => campaignStores.find(store => store.id === storeId)?.name).join(', '),
      vouchers: 0,
      usage: 0,
      status: 'active',
    }))
  } catch {
    return []
  }
}

// Fronteira para substituir o mock por uma API sem acoplar a página ao armazenamento.
export function activateCampaign(draft: CampaignDraft) {
  const validated = campaignSchema.parse(draft)
  const created = readCreatedCampaigns()
  const previousDraft = localStorage.getItem(campaignDraftStorageKey)
  const entry = { id: crypto.randomUUID(), draft: validated }

  localStorage.removeItem(campaignDraftStorageKey)
  try {
    localStorage.setItem(createdCampaignsStorageKey, JSON.stringify([entry, ...created]))
  } catch (error) {
    if (previousDraft !== null) localStorage.setItem(campaignDraftStorageKey, previousDraft)
    throw error
  }
}
