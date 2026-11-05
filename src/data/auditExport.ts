import type { AuditRecord } from '../types/audit'
import { auditOperationLabels, auditStatusLabels, formatAuditDateTime, getAuditJustification } from './auditRepository'

function csvCell(value: string) {
  // Impede interpretação de conteúdo textual como fórmula em planilhas.
  const text = /^\s*[=+@-]/.test(value) ? `'${value}` : value
  return `"${text.replaceAll('"', '""')}"`
}

export function createAuditCsv(records: readonly AuditRecord[]) {
  const rows = [
    ['Código', 'Campanha', 'Data e hora', 'Responsável', 'Operação', 'Perfil', 'Status', 'Crítica', 'Alterações', 'Motivo de bloqueio', 'Alertas prioritários', 'Falha técnica', 'Justificativa'],
    ...records.map(item => [
      item.code, item.campaignName, formatAuditDateTime(item.occurredAt, true), item.responsibleName,
      auditOperationLabels[item.operation], item.profile, auditStatusLabels[item.status], item.critical ? 'Sim' : 'Não',
      item.changes.map(change => `${change.field}: ${change.before} → ${change.after}`).join(' | '),
      item.blockingReason ?? '', item.priorityAlerts?.join(' | ') ?? '',
      item.technicalFailure ? `${item.technicalFailure.code}: ${item.technicalFailure.message}` : '',
      getAuditJustification(item),
    ]),
  ]
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')
}

export function downloadAuditCsv(records: readonly AuditRecord[], filename = 'historico-auditoria.csv') {
  const blob = new Blob([createAuditCsv(records)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  try {
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(url)
  }
}
