export type AuditOperation = 'edit' | 'approve' | 'pause' | 'block' | 'priority-alert' | 'technical-failure'
export type AuditStatus = 'active' | 'scheduled' | 'ended' | 'blocked' | 'warning' | 'failed'

export interface AuditChange {
  field: string
  before: string
  after: string
}

export interface AuditRecord {
  id: string
  code: string
  campaignId: string
  campaignName: string
  occurredAt: string
  responsibleId: string
  responsibleName: string
  profile: string
  operation: AuditOperation
  status: AuditStatus
  critical: boolean
  changes: readonly AuditChange[]
  blockingReason?: string
  priorityAlerts?: readonly string[]
  technicalFailure?: { code: string; message: string }
}

export interface AuditFilters {
  search: string
  operation: string
  responsible: string
  period: string
}
