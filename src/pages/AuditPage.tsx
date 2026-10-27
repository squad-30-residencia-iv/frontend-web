import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, TriangleAlert } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useFeedback } from '../components/ui/useFeedback'
import { AuditFilters } from '../components/audit/AuditFilters'
import { AuditTable } from '../components/audit/AuditTable'
import { AuditRecordDetails } from '../components/audit/AuditRecordDetails'
import { downloadAuditCsv } from '../data/auditExport'
import { emptyAuditFilters, filterAuditRecords, getAuditSummary, loadAuditRecords } from '../data/auditRepository'
import type { AuditFilters as Filters, AuditRecord } from '../types/audit'
import './AuditPage.css'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'success'; records: readonly AuditRecord[] }
export interface AuditPageProps {
  /** Função estável de módulo ou useCallback, como no carregador da Home. */
  loadRecords?: () => Promise<readonly AuditRecord[]>
}

export function AuditPage({ loadRecords = loadAuditRecords }: AuditPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [filters, setFilters] = useState<Filters>(emptyAuditFilters)
  const [applied, setApplied] = useState<Filters>(emptyAuditFilters)
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null)
  const feedback = useFeedback()

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(loadRecords).then(records => {
      if (!cancelled) setState({ status: 'success', records })
    }).catch(() => {
      if (!cancelled) setState({ status: 'error' })
    })
    return () => { cancelled = true }
  }, [loadRecords, attempt])

  const filtered = useMemo(() => state.status === 'success' ? filterAuditRecords(state.records, applied) : [], [state, applied])
  const summary = useMemo(() => state.status === 'success' ? getAuditSummary(state.records) : null, [state])

  function retry() {
    setState({ status: 'loading' })
    setAttempt(current => current + 1)
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({ ...filters })
    setPage(1)
  }

  function clearFilters() {
    setFilters(emptyAuditFilters)
    setApplied(emptyAuditFilters)
    setPage(1)
  }

  function updateFilter(field: keyof Filters, value: string) {
    setFilters(current => ({ ...current, [field]: value }))
  }

  function exportHistory() {
    try {
      downloadAuditCsv(filtered)
      feedback.success({ title: 'Histórico exportado.', description: `${filtered.length} registros incluídos no CSV.` })
    } catch {
      feedback.error({ title: 'Não foi possível exportar o histórico.', description: 'Seus filtros foram mantidos. Tente novamente.' })
    }
  }

  return <PortalLayout activeSection="audit">
    <div className="audit-page" aria-busy={state.status === 'loading'}>
      <PageHeader
        title="Auditoria"
        breadcrumbs={[{ label: 'Portal' }, { label: 'Auditoria' }]}
        action={<Button className="audit-export" startIcon={Plus} onPress={exportHistory}
          isDisabled={state.status !== 'success' || filtered.length === 0}>Exportar histórico</Button>}
      />
      {state.status === 'loading' && <Loading message="Carregando auditoria…" />}
      {state.status === 'error' && <div role="alert"><EmptyState
        icon={TriangleAlert}
        title="Não foi possível carregar a auditoria"
        description="Tente carregar os registros novamente."
        action={<Button variant="secondary" onPress={retry}>Tentar novamente</Button>}
      /></div>}
      {state.status === 'success' && summary && <>
        <section className="audit-summary" aria-label="Resumo de auditoria">
          {[
            { label: 'Total de operações', value: summary.total },
            { label: 'Campanhas alteradas', value: summary.campaigns },
            { label: 'Usuários responsáveis', value: summary.users },
            { label: 'Operações críticas', value: summary.critical },
          ].map(({ label, value }) => <article className="audit-summary-card" key={label}>
            <h2>{label}</h2>
            <strong>{new Intl.NumberFormat('pt-BR').format(value)}</strong>
          </article>)}
        </section>
        <AuditFilters filters={filters} records={state.records} onChange={updateFilter} onApply={applyFilters} onClear={clearFilters} />
        <AuditTable records={filtered} page={page} onPageChange={setPage} onDetails={setSelectedRecord}
          onClear={clearFilters} hasRecords={state.records.length > 0} />
      </>}
      <AuditRecordDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  </PortalLayout>
}
