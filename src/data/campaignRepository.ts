import { z } from 'zod'
import { campaignSchema } from '../schemas/campaignSchema'
import { campaignDraftStorageKey } from './campaignDraft'
import { campaignStores } from './campaignScope'
import { campaigns, detailsReferenceCampaign } from './campaigns'
import { campaignStatuses, type Campaign, type CampaignAction, type CampaignDraft, type CampaignRole } from '../types/campaign'
import { campaignTransitions, getCampaignActions } from './campaignWorkflow'

export const createdCampaignsStorageKey = 'portal-campaigns:created:v1'
export const campaignChangesStorageKey = 'portal-campaigns:status-changes:v1'
const storedCampaignsSchema = z.array(z.object({
  id: z.string().min(1),
  draft: campaignSchema,
  // Compatibilidade: campanhas gravadas pela implementação anterior já eram ativas.
  status: z.enum(campaignStatuses).default('active'),
}))
const changesSchema = z.record(z.string(), z.object({
  status: z.enum(campaignStatuses),
  rejectionReason: z.string().optional(),
}))
const listeners = new Set<() => void>()
const inFlight = new Set<string>()
let revision = 0

function notifyChanges() {
  revision += 1
  listeners.forEach(listener => listener())
}

function handleStorage(event: StorageEvent) {
  if (event.key === null || event.key === campaignChangesStorageKey || event.key === createdCampaignsStorageKey) notifyChanges()
}

export function subscribeCampaigns(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', handleStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', handleStorage)
  }
}

export function getCampaignRevision() { return revision }

function readCreatedCampaigns() {
  const stored = localStorage.getItem(createdCampaignsStorageKey)
  return stored ? storedCampaignsSchema.parse(JSON.parse(stored)) : []
}

function readChanges() {
  const stored = localStorage.getItem(campaignChangesStorageKey)
  return stored ? changesSchema.parse(JSON.parse(stored)) : {}
}

export function applyCampaignStatusChanges(items: readonly Campaign[]): Campaign[] {
  try {
    const changes = readChanges()
    return items.map(item => changes[item.id] ? { ...item, ...changes[item.id] } : item)
  } catch {
    // Leitura inválida não apaga dados; as mutações abaixo recusam sobrescrevê-los.
    return [...items]
  }
}

export function loadCreatedCampaigns(): Campaign[] {
  try {
    return applyCampaignStatusChanges(readCreatedCampaigns().map(({ id, draft, status }) => ({
      id, status,
      name: draft.information.name.trim(),
      start: draft.information.start.slice(0, 10),
      end: draft.information.end.slice(0, 10),
      scope: draft.scope.mode === 'network' ? 'Toda a rede' : draft.scope.storeIds
        .map(storeId => campaignStores.find(store => store.id === storeId)?.name).join(', '),
      vouchers: 0,
      usage: 0,
    })))
  } catch {
    return []
  }
}

export function getCampaigns(): Campaign[] {
  return applyCampaignStatusChanges([...loadCreatedCampaigns(), ...campaigns])
}

export function getCampaignById(id: string): Campaign | undefined {
  return getCampaigns().find(item => item.id === id)
    ?? applyCampaignStatusChanges([detailsReferenceCampaign]).find(item => item.id === id)
}

// Salva uma campanha válida em rascunho. A ativação só acontece pela aprovação.
export function createCampaign(draft: CampaignDraft) {
  const validated = campaignSchema.parse(draft)
  const created = readCreatedCampaigns()
  const previousDraft = localStorage.getItem(campaignDraftStorageKey)
  const entry = { id: crypto.randomUUID(), draft: validated, status: 'draft' as const }
  localStorage.removeItem(campaignDraftStorageKey)
  try {
    localStorage.setItem(createdCampaignsStorageKey, JSON.stringify([entry, ...created]))
  } catch (error) {
    if (previousDraft !== null) localStorage.setItem(campaignDraftStorageKey, previousDraft)
    throw error
  }
  notifyChanges()
}

export interface CampaignActionRequest {
  campaignId: string
  action: CampaignAction
  role: CampaignRole | null
  reason?: string
  simulateFailure?: boolean
}

// Único ponto de troca pela API: guarda de concorrência, permissões e persistência.
export async function performCampaignAction(request: CampaignActionRequest): Promise<Campaign> {
  const { campaignId, action, role, reason, simulateFailure } = request
  if (inFlight.has(campaignId)) throw new Error('Já existe uma ação em andamento para esta campanha.')
  inFlight.add(campaignId)
  try {
    await Promise.resolve()
    const campaign = getCampaignById(campaignId)
    if (!campaign) throw new Error('Campanha não encontrada.')
    if (!getCampaignActions(campaign.status, role).includes(action)) {
      throw new Error('Esta ação não é permitida para seu perfil ou para o status atual da campanha.')
    }
    if (simulateFailure) throw new Error('Falha simulada. O status da campanha foi mantido.')
    const changes = readChanges()
    const update = {
      status: campaignTransitions[action].to,
      ...(action === 'reject' ? { rejectionReason: reason?.trim() ?? '' } : {}),
    }
    // Nenhuma atualização de UI ocorre se a gravação falhar.
    localStorage.setItem(campaignChangesStorageKey, JSON.stringify({ ...changes, [campaignId]: update }))
    notifyChanges()
    return { ...campaign, ...update }
  } finally {
    inFlight.delete(campaignId)
  }
}
