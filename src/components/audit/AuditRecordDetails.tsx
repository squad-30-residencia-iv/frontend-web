import { Modal } from '../ui/Modal'
import { auditOperationLabels, auditStatusLabels, formatAuditDateTime } from '../../data/auditRepository'
import type { AuditRecord } from '../../types/audit'
import './AuditRecordDetails.css'

interface AuditRecordDetailsProps {
  record: AuditRecord | null
  onClose: () => void
}

export function AuditRecordDetails({ record, onClose }: AuditRecordDetailsProps) {
  return <Modal
    isOpen={record !== null}
    onOpenChange={isOpen => { if (!isOpen) onClose() }}
    title="Detalhes do registro"
    secondaryAction={{ label: 'Fechar', onPress: onClose }}
  >
    {record && <div className="audit-record-details">
      <dl>
        <div><dt>Código</dt><dd>{record.code}</dd></div>
        <div><dt>Campanha</dt><dd>{record.campaignName}</dd></div>
        <div><dt>Data e hora</dt><dd>{formatAuditDateTime(record.occurredAt, true)}</dd></div>
        <div><dt>Usuário responsável</dt><dd>{record.responsibleName}</dd></div>
        <div><dt>Perfil</dt><dd>{record.profile}</dd></div>
        <div><dt>Operação</dt><dd>{auditOperationLabels[record.operation]}</dd></div>
        <div><dt>Status</dt><dd>{auditStatusLabels[record.status]}</dd></div>
        <div><dt>Operação crítica</dt><dd>{record.critical ? 'Sim' : 'Não'}</dd></div>
      </dl>
      {record.changes.length > 0 && <section aria-label="Alterações realizadas">
        <h3>Alterações realizadas</h3>
        <ul>{record.changes.map((change, index) => <li key={`${change.field}-${index}`}>
          <strong>{change.field}</strong>
          <p>Antes: {change.before}</p>
          <p>Depois: {change.after}</p>
        </li>)}</ul>
      </section>}
      {record.blockingReason && <section aria-label="Motivo de bloqueio">
        <h3>Motivo de bloqueio</h3>
        <p>{record.blockingReason}</p>
      </section>}
      {record.priorityAlerts && record.priorityAlerts.length > 0 && <section aria-label="Alertas prioritários">
        <h3>Alertas prioritários</h3>
        <ul>{record.priorityAlerts.map((alert, index) => <li key={index}>{alert}</li>)}</ul>
      </section>}
      {record.technicalFailure && <section aria-label="Falha técnica">
        <h3>Falha técnica</h3>
        <p>{record.technicalFailure.code}</p>
        <p>{record.technicalFailure.message}</p>
      </section>}
    </div>}
  </Modal>
}
