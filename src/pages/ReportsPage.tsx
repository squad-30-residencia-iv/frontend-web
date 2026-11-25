import { useEffect, useState } from 'react'
import { Download, TriangleAlert } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { ReportBarChart } from '../components/reports/ReportBarChart'
import { ReportFiltersForm } from '../components/reports/ReportFiltersForm'
import { ReportKpiCards } from '../components/reports/ReportKpiCards'
import { ReportStatusDonut } from '../components/reports/ReportStatusDonut'
import { RegionPerformanceTable, TopCampaignsTable } from '../components/reports/ReportTables'
import { buildReportCsv, downloadCsv, reportCsvFilename } from '../components/reports/reportFormatters'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { useAuth } from '../contexts/AuthContext'
import { defaultReportFilters, normalizeReportFilters, parseReportFilters, serializeReportFilters } from '../data/reportFilters'
import { fetchReport, fetchReportCatalog } from '../data/reports'
import { emptyReportCatalog, emptyReportData, fetchReportCatalogFromApi, fetchReportFromApi } from '../services/reports'
import type { ReportCatalog, ReportData, ReportFilters } from '../types/report'
import './ReportsPage.css'

type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; catalog: ReportCatalog }

type ReportState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: ReportData }

export interface ReportsPageProps {
  /** Mantenha a referência estável (função de módulo ou useCallback): ela dispara o carregamento. */
  loadCatalog?: (signal?: AbortSignal) => Promise<ReportCatalog>
  loadReport?: (filters: ReportFilters, signal?: AbortSignal) => Promise<ReportData>
}

const pageTitle = 'Relatórios e indicadores'
const pageSubtitle = 'Acompanhe o desempenho das campanhas e a utilização dos vouchers'
const breadcrumbs = [{ label: 'Portal' }, { label: 'Relatórios' }]

export function ReportsPage({ loadCatalog, loadReport }: ReportsPageProps) {
  const { user } = useAuth()
  const networkId = user?.networkId ?? null
  const hasSession = user !== null
  const noScope = hasSession && !networkId
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    Promise.resolve().then(() => {
      if (noScope) return emptyReportCatalog()
      if (loadCatalog) return loadCatalog(controller.signal)
      if (networkId) return fetchReportCatalogFromApi(networkId, controller.signal)
      return fetchReportCatalog()
    }).then(catalog => {
      if (!controller.signal.aborted) setState({ status: 'success', catalog })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ status: 'error', message: error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.' })
    })
    return () => controller.abort()
  }, [loadCatalog, networkId, noScope, attempt])

  function handleRetry() {
    setState({ status: 'loading' })
    setAttempt(current => current + 1)
  }

  return <PortalLayout activeSection="reports">
    <div className="reports-page">
      <ReportsContent
        key={String(networkId) + ':' + (hasSession ? 'session' : 'local') + ':' + (noScope ? 'no-scope' : state.status === 'success' ? 'ready' : 'pending')}
        catalog={state.status === 'success' ? state.catalog : emptyReportCatalog()}
        catalogReady={state.status === 'success'}
        catalogError={state.status === 'error' ? state.message : undefined}
        onCatalogRetry={handleRetry}
        noScope={noScope}
        networkId={networkId}
        loadReport={loadReport}
      />
    </div>
  </PortalLayout>
}

function writeFiltersToUrl(filters: ReportFilters) {
  // replaceState: aplicar filtros não polui o histórico e não dispara popstate.
  window.history.replaceState(null, '', `${window.location.pathname}${serializeReportFilters(filters)}`)
}

interface ReportsContentProps {
  catalog: ReportCatalog
  catalogReady: boolean
  catalogError?: string
  onCatalogRetry: () => void
  noScope: boolean
  networkId: string | null
  loadReport?: (filters: ReportFilters, signal?: AbortSignal) => Promise<ReportData>
}

function ReportsContent({ catalog, catalogReady, catalogError, onCatalogRetry, noScope, networkId, loadReport }: ReportsContentProps) {
  const [initial] = useState(() => parseReportFilters(window.location.search, catalog))
  const [draft, setDraft] = useState<ReportFilters>(initial)
  const [applied, setApplied] = useState<ReportFilters>(initial)
  const [report, setReport] = useState<ReportState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  const [exportError, setExportError] = useState('')
  useEffect(() => {
    if (!catalogReady || noScope) return
    const controller = new AbortController()
    setReport({ status: 'loading' })
    Promise.resolve().then(() => {
      if (loadReport) return loadReport(applied, controller.signal)
      return networkId ? fetchReportFromApi(networkId, applied, controller.signal) : fetchReport(applied)
    }).then(data => {
      if (!controller.signal.aborted) setReport({ status: 'success', data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setReport({ status: 'error', message: error instanceof Error ? error.message : 'Tente carregar os dados novamente.' })
    })
    return () => controller.abort()
  }, [loadReport, networkId, catalogReady, noScope, applied, attempt])

  function commit(filters: ReportFilters) {
    setExportError('')
    const next = normalizeReportFilters(catalog, filters)
    setDraft(next)
    setApplied({ ...next })
    setReport({ status: 'loading' })
    writeFiltersToUrl(next)
  }

  function handleRemoveFilter(field: keyof ReportFilters) {
    commit({ ...applied, [field]: defaultReportFilters[field] })
  }

  function handleRetry() {
    setReport({ status: 'loading' })
    setAttempt(current => current + 1)
  }

  const data = report.status === 'success' && !noScope ? report.data : emptyReportData()
  const busy = !noScope && !catalogError && (!catalogReady || report.status === 'loading')
  const success = catalogReady && !noScope && report.status === 'success'
  const isEmpty = success && data.kpis.issued === 0

  function handleExport() {
    try {
      downloadCsv(reportCsvFilename, buildReportCsv(data, applied, catalog))
      setExportError('')
    } catch { setExportError('Não foi possível exportar o CSV. Tente novamente.') }
  }

  return <>
    <PageHeader
      title={pageTitle}
      subtitle={pageSubtitle}
      breadcrumbs={breadcrumbs}
      action={<Button variant="secondary" startIcon={Download} isDisabled={!success || isEmpty} onPress={handleExport}>Exportar CSV</Button>}
    />
    <ReportFiltersForm
      catalog={catalog}
      draft={draft}
      applied={applied}
      isBusy={busy || noScope || Boolean(catalogError)}
      onDraftChange={setDraft}
      onApply={() => commit(draft)}
      onClear={() => commit(defaultReportFilters)}
      onRemoveFilter={handleRemoveFilter}
    />
    <div aria-busy={busy}>
      {noScope && <EmptyState title="Rede não definida" description="Sua conta não possui uma rede ou escopo definido para consultar relatórios. Solicite a configuração do escopo ao administrador." />}
      {busy && <Loading message={catalogReady ? 'Atualizando indicadores…' : 'Carregando relatórios…'} />}
      {(catalogError || report.status === 'error') && !noScope && <div role="alert">
        <EmptyState icon={TriangleAlert}
          title={catalogError ? 'Não foi possível carregar os relatórios' : 'Não foi possível carregar os indicadores'}
          description={catalogError ?? (report.status === 'error' ? report.message : '')}
          action={<Button variant="secondary" onPress={catalogError ? onCatalogRetry : handleRetry}>Tentar novamente</Button>} />
      </div>}
      {exportError && <p role="alert">{exportError}</p>}
      {isEmpty && <div className="reports-empty" role="status">
        <strong>Nenhum voucher encontrado</strong>
        <span>Não há vouchers para a combinação de filtros aplicada.</span>
      </div>}
        <ReportKpiCards kpis={data.kpis} />
        <div className="reports-charts">
          <ReportBarChart data={data.monthly} />
          <ReportStatusDonut data={data.statusDistribution} />
        </div>
        <div className="reports-tables">
          <TopCampaignsTable rows={data.topCampaigns} />
          <RegionPerformanceTable rows={data.regions} />
        </div>
    </div>
  </>
}
