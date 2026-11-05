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
import { defaultReportFilters, normalizeReportFilters, parseReportFilters, serializeReportFilters } from '../data/reportFilters'
import { fetchReport, fetchReportCatalog } from '../data/reports'
import { navigate } from '../navigation/navigate'
import type { ReportCatalog, ReportData, ReportFilters } from '../types/report'
import './ReportsPage.css'

type CatalogState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; catalog: ReportCatalog }

type ReportState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: ReportData }

export interface ReportsPageProps {
  /** Mantenha a referência estável (função de módulo ou useCallback): ela dispara o carregamento. */
  loadCatalog?: () => Promise<ReportCatalog>
  loadReport?: (filters: ReportFilters) => Promise<ReportData>
}

const pageTitle = 'Relatórios e indicadores'
const pageSubtitle = 'Acompanhe o desempenho das campanhas e a utilização dos vouchers'
const breadcrumbs = [{ label: 'Portal' }, { label: 'Relatórios' }]

export function ReportsPage({ loadCatalog = fetchReportCatalog, loadReport = fetchReport }: ReportsPageProps) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then(catalog => {
        if (!cancelled) setState({ status: 'success', catalog })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => { cancelled = true }
  }, [loadCatalog, attempt])

  function handleRetry() {
    setState({ status: 'loading' })
    setAttempt(current => current + 1)
  }

  return <PortalLayout activeSection="reports">
    <div className="reports-page" aria-busy={state.status === 'loading'}>
      {state.status !== 'success' && <PageHeader title={pageTitle} subtitle={pageSubtitle} breadcrumbs={breadcrumbs} />}
      {state.status === 'loading' && <Loading message="Carregando relatórios…" />}
      {state.status === 'error' && <div role="alert">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível carregar os relatórios"
          description="Verifique sua conexão e tente novamente."
          action={<Button variant="secondary" onPress={handleRetry}>Tentar novamente</Button>}
        />
      </div>}
      {state.status === 'success' && state.catalog.campaigns.length === 0 && <>
        <PageHeader title={pageTitle} subtitle={pageSubtitle} breadcrumbs={breadcrumbs} />
        <EmptyState
          title="Nenhuma campanha cadastrada"
          description="Crie uma campanha para começar a acompanhar a utilização dos vouchers."
          action={<Button onPress={() => navigate('/campanhas/nova')}>Criar campanha</Button>}
        />
      </>}
      {state.status === 'success' && state.catalog.campaigns.length > 0 && <ReportsContent catalog={state.catalog} loadReport={loadReport} />}
    </div>
  </PortalLayout>
}

function writeFiltersToUrl(filters: ReportFilters) {
  // replaceState: aplicar filtros não polui o histórico e não dispara popstate.
  window.history.replaceState(null, '', `${window.location.pathname}${serializeReportFilters(filters)}`)
}

interface ReportsContentProps {
  catalog: ReportCatalog
  loadReport: (filters: ReportFilters) => Promise<ReportData>
}

function ReportsContent({ catalog, loadReport }: ReportsContentProps) {
  const [initial] = useState(() => parseReportFilters(window.location.search, catalog))
  const [draft, setDraft] = useState<ReportFilters>(initial)
  const [applied, setApplied] = useState<ReportFilters>(initial)
  const [report, setReport] = useState<ReportState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadReport(applied)
      .then(data => {
        if (!cancelled) setReport({ status: 'success', data })
      })
      .catch(() => {
        if (!cancelled) setReport({ status: 'error' })
      })
    return () => { cancelled = true }
  }, [loadReport, applied, attempt])

  function commit(filters: ReportFilters) {
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

  const data = report.status === 'success' ? report.data : null
  const isEmpty = data !== null && data.kpis.issued === 0

  function handleExport() {
    if (data) downloadCsv(reportCsvFilename, buildReportCsv(data, applied, catalog))
  }

  return <>
    <PageHeader
      title={pageTitle}
      subtitle={pageSubtitle}
      breadcrumbs={breadcrumbs}
      action={<Button variant="secondary" startIcon={Download} isDisabled={!data || isEmpty} onPress={handleExport}>Exportar CSV</Button>}
    />
    <ReportFiltersForm
      catalog={catalog}
      draft={draft}
      applied={applied}
      isBusy={report.status === 'loading'}
      onDraftChange={setDraft}
      onApply={() => commit(draft)}
      onClear={() => commit(defaultReportFilters)}
      onRemoveFilter={handleRemoveFilter}
    />
    <div aria-busy={report.status === 'loading'}>
      {report.status === 'loading' && <Loading message="Atualizando indicadores…" />}
      {report.status === 'error' && <div role="alert">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível carregar os indicadores"
          description="Tente carregar os dados novamente."
          action={<Button variant="secondary" onPress={handleRetry}>Tentar novamente</Button>}
        />
      </div>}
      {data && <>
        {isEmpty && <div className="reports-empty" role="status">
          <strong>Nenhum voucher encontrado</strong>
          <span>Não há vouchers para a combinação de filtros aplicada.</span>
          <Button variant="secondary" onPress={() => commit(defaultReportFilters)}>Limpar filtros</Button>
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
      </>}
    </div>
  </>
}
