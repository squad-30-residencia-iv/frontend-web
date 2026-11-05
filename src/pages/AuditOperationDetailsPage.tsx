import { useEffect, useState, type MouseEvent } from 'react'
import { ChevronLeft, Plus, TriangleAlert } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { AuditStatusBadge } from '../components/audit/AuditStatusBadge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useFeedback } from '../components/ui/useFeedback'
import { downloadAuditCsv } from '../data/auditExport'
import { auditOperationLabels, formatAuditDateTime, getAuditJustification, loadAuditRecord } from '../data/auditRepository'
import { returnToAudit } from '../navigation/auditNavigation'
import type { AuditRecord } from '../types/audit'
import './AuditOperationDetailsPage.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'success'; record: AuditRecord }

export interface AuditOperationDetailsPageProps {
  operationId: string
  /** Carregador estável, substituível pelo serviço real na integração. */
  loadRecord?: (operationId: string) => Promise<AuditRecord | undefined>
}

export function AuditOperationDetailsPage({ operationId, loadRecord = loadAuditRecord }: AuditOperationDetailsPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const feedback = useFeedback()

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    Promise.resolve().then(() => loadRecord(operationId)).then(record => {
      if (!cancelled) setState(record ? { status: 'success', record } : { status: 'not-found' })
    }).catch(() => {
      if (!cancelled) setState({ status: 'error' })
    })
    return () => { cancelled = true }
  }, [operationId, loadRecord, attempt])

  function handleReturnLink(event: MouseEvent<HTMLAnchorElement>) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    returnToAudit()
  }

  function exportEvent() {
    if (state.status !== 'success') return
    try {
      downloadAuditCsv([state.record], `evento-${state.record.code}.csv`)
      feedback.success({ title: 'Evento exportado.' })
    } catch {
      feedback.error({ title: 'Não foi possível exportar o evento.', description: 'Os dados foram mantidos. Tente novamente.' })
    }
  }

  return <PortalLayout activeSection="audit">
    <div className="audit-operation-page" aria-busy={state.status === 'loading'}>
      <PageHeader
        title="Detalhes da operação"
        breadcrumbs={[
          { label: 'Portal' },
          { label: 'Auditoria', href: '/auditoria', onClick: handleReturnLink },
          { label: 'Detalhes da operação' },
        ]}
        action={<Button
          className="audit-operation-export"
          startIcon={Plus}
          isDisabled={state.status !== 'success'}
          onPress={exportEvent}
        >Exportar evento</Button>}
      />
      {state.status === 'loading' && <Loading message="Carregando operação…" />}
      {state.status === 'error' && <div role="alert"><EmptyState
        icon={TriangleAlert}
        title="Não foi possível carregar a operação"
        description="Tente carregar os dados novamente."
        action={<Button variant="secondary" onPress={() => setAttempt(value => value + 1)}>Tentar novamente</Button>}
      /></div>}
      {state.status === 'not-found' && <EmptyState
        title="Operação não encontrada"
        description="Não há um registro de auditoria com este identificador."
      />}
      {state.status === 'success' && <AuditOperationContent record={state.record} />}
      <footer className="audit-operation-footer">
        <Button variant="ghost" startIcon={ChevronLeft} onPress={returnToAudit}>Voltar para auditoria</Button>
      </footer>
    </div>
  </PortalLayout>
}

function AuditOperationContent({ record }: { record: AuditRecord }) {
  return <>
    <section className="audit-operation-information" aria-labelledby="audit-operation-information-title">
      <h2 id="audit-operation-information-title">Informações da operação</h2>
      <div className="audit-operation-scroll" role="region" aria-label="Informações com rolagem horizontal" tabIndex={0}>
        <table className="audit-operation-information-table">
          <caption className="audit-operation-sr-only">Informações da operação {record.code}</caption>
          <thead><tr>{['Nome da campanha', 'Data/Hora', 'Responsável', 'Operação', 'Perfil', 'Status'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody><tr>
            <th scope="row">{record.campaignName}</th>
            <td className="audit-operation-muted"><time dateTime={record.occurredAt}>{formatAuditDateTime(record.occurredAt)}</time></td>
            <td>{record.responsibleName}</td>
            <td>{auditOperationLabels[record.operation]}</td>
            <td>{record.profile}</td>
            <td><AuditStatusBadge status={record.status} /></td>
          </tr></tbody>
        </table>
      </div>
    </section>
    <section className="audit-operation-changes" aria-labelledby="audit-operation-changes-title">
      <h2 id="audit-operation-changes-title">Alterações realizadas</h2>
      <div className="audit-operation-changes-card">
        <div className="audit-operation-scroll" role="region" aria-label="Alterações com rolagem horizontal" tabIndex={0}>
          <table className="audit-operation-changes-table">
            <caption className="audit-operation-sr-only">Alterações realizadas na operação</caption>
            <thead><tr><th scope="col">Campo alterado</th><th scope="col">Valor anterior</th><th scope="col">Novo valor</th></tr></thead>
            <tbody>
              {record.changes.length === 0
                ? <tr><td colSpan={3} className="audit-operation-no-changes">Nenhuma alteração realizada neste evento.</td></tr>
                : record.changes.map((change, index) => <tr key={`${change.field}-${index}`}>
                  <th scope="row">{change.field}</th>
                  <td className="audit-operation-muted">{change.before}</td>
                  <td>{change.after}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
    <section className="audit-operation-justification" aria-labelledby="audit-operation-justification-title">
      <h2 id="audit-operation-justification-title">Justificativa</h2>
      <p>{getAuditJustification(record)}</p>
    </section>
  </>
}
