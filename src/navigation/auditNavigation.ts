import { z } from 'zod'
import { navigate } from './navigate'
import type { AuditFilters } from '../types/audit'

const filtersSchema = z.object({
  search: z.string(),
  operation: z.enum(['all', 'edit', 'approve', 'pause', 'block', 'priority-alert', 'technical-failure']),
  responsible: z.string().min(1),
  period: z.enum(['all', '30', '90']),
})
const listStateSchema = z.object({
  filters: filtersSchema,
  applied: filtersSchema,
  page: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
export interface AuditListState {
  filters: AuditFilters
  applied: AuditFilters
  page: number
}

// Guarda somente o estado da interface, nunca cópias dos registros do repositório.
export function readAuditListState(): AuditListState | null {
  const result = z.object({ auditList: listStateSchema }).safeParse(window.history.state)
  return result.success ? result.data.auditList : null
}

export function openAuditOperation(operationId: string, listState: AuditListState) {
  const current: unknown = window.history.state
  const previous = current && typeof current === 'object' ? current : {}
  window.history.replaceState({ ...previous, auditList: listState }, '', window.location.href)
  navigate(`/auditoria/${encodeURIComponent(operationId)}`, { auditList: listState })
}

export function returnToAudit() {
  const listState = readAuditListState()
  navigate('/auditoria', listState ? { auditList: listState } : null)
}
