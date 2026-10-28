import { auditStatusLabels } from '../../data/auditRepository'
import type { AuditStatus } from '../../types/audit'
import './AuditStatusBadge.css'

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  return <span className={`audit-status audit-tone-${status}`}>
    <span aria-hidden="true">● </span>{auditStatusLabels[status]}
  </span>
}
