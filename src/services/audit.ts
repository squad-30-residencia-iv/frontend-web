import { api } from './api'
import type { AuditOperation, AuditRecord, AuditStatus } from '../types/audit'

interface ApiAuditEntry {
  id: string
  eventType: string
  actorType: string
  actorId: string
  campaignId: string | null
  campaignName: string | null
  entityType: string
  entityId: string
  occurredAt: string
  payload: string | null
  networkId?: string | null
}

const operationByEvent: Record<string, AuditOperation> = {
  CampaignApproved: 'approve',
  CampaignPaused: 'pause',
  CampaignSubmitted: 'edit',
  CampaignRejected: 'edit',
  CampaignEnded: 'edit',
  CampaignDuplicated: 'edit',
  VoucherIssued: 'edit',
  VoucherConfirmed: 'edit',
  VoucherCancelled: 'edit',
  VoucherIssuanceRefused: 'block',
  VoucherRedeemed: 'edit',
  VoucherRedemptionRefused: 'block',
  VoucherRedemptionReversed: 'edit',
}

const statusByEvent: Record<string, AuditStatus> = {
  CampaignApproved: 'scheduled',
  CampaignPaused: 'ended',
  CampaignSubmitted: 'active',
  CampaignRejected: 'ended',
  CampaignEnded: 'ended',
  CampaignDuplicated: 'active',
  VoucherIssuanceRefused: 'blocked',
  VoucherRedemptionRefused: 'blocked',
}

function mapEntry(entry: ApiAuditEntry, index: number): AuditRecord {
  const operation = operationByEvent[entry.eventType] ?? 'edit'
  return {
    id: entry.id,
    code: `AUD-${String(index + 1).padStart(4, '0')}`,
    campaignId: entry.campaignId ?? entry.entityId,
    campaignName: entry.campaignName ?? 'Operação sem campanha',
    occurredAt: entry.occurredAt,
    responsibleId: entry.actorId,
    responsibleName: entry.actorType === 'Application' ? 'Aplicação satélite' : 'Usuário do portal',
    profile: entry.actorType === 'Application' ? 'Aplicação' : 'Portal',
    operation,
    status: statusByEvent[entry.eventType] ?? 'active',
    critical: operation === 'block',
    changes: entry.payload
      ? [{ field: 'Evento', before: '—', after: entry.eventType }]
      : [{ field: 'Evento', before: '—', after: entry.eventType }],
    justification: entry.payload ?? undefined,
  }
}

export async function fetchAuditRecords(networkId: string | null): Promise<readonly AuditRecord[]> {
  if (!networkId) return []
  const { data } = await api.get<ApiAuditEntry[]>('/api/v1/audit-entries', { params: { networkId } })
  return (Array.isArray(data) ? data : []).map(mapEntry)
}

export async function fetchAuditRecord(operationId: string): Promise<AuditRecord | undefined> {
  try {
    const { data } = await api.get<ApiAuditEntry>(`/api/v1/audit-entries/${operationId}`)
    return mapEntry(data, 0)
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) return undefined
    }
    throw error
  }
}
