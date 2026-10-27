import { useMemo, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  CalendarClock,
  ChartNoAxesColumn,
  CircleCheck,
  Clock,
  Info,
  Megaphone,
  Pause,
  Play,
  SquarePen,
  Ticket,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '../components/shared/PageHeader'
import { PortalLayout } from '../components/layout/PortalLayout'
import { CampaignActionsMenu } from '../components/campaigns/CampaignActionsMenu'
import { formatNumber } from '../components/home/formatters'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useFeedback } from '../components/ui/useFeedback'
import { getCampaignDetails, getCampaignMetrics, getCampaignTiming, type CampaignPhase } from '../data/campaignDetails'
import { navigate } from '../navigation/navigate'
import { statusLabels, type CampaignStatus } from '../types/campaign'
import {
  voucherStatusLabels,
  type CampaignDetails,
  type CampaignInfoSection,
  type CampaignVoucher,
  type VoucherStatus,
} from '../types/campaignDetails'
import './CampaignDetailsPage.css'

// ---- Formatadores (data e hora em Brasília) ----

const TIME_ZONE = 'America/Sao_Paulo'
const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const percentFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function getParts(iso: string) {
  const entries = dateTimeFormat.formatToParts(new Date(iso)).map(part => [part.type, part.value])
  return Object.fromEntries(entries) as Record<string, string>
}

// "2026-10-05T11:48:00-03:00" -> "05/10/2026 · 11:48" (hora de Brasília)
function formatDateTime(iso: string, separator = ' · '): string {
  const { day, month, year, hour, minute } = getParts(iso)
  return `${day}/${month}/${year}${separator}${hour}:${minute}`
}

// "2026-10-31T23:59:00-03:00" -> "31 out"
function formatShortDate(iso: string): string {
  const { day, month } = getParts(iso)
  return `${Number(day)} ${monthLabels[Number(month) - 1]}`
}

// 40 -> "40,0%"
function formatPercent(value: number): string {
  return `${percentFormat.format(value)}%`
}

// ---- Etiqueta de status ----

type StatusTone = 'success' | 'info' | 'warning' | 'neutral'

const campaignStatusTones: Record<CampaignStatus, StatusTone> = {
  active: 'success',
  scheduled: 'info',
  paused: 'warning',
  ended: 'neutral',
}

const voucherStatusTones: Record<VoucherStatus, StatusTone> = {
  available: 'success',
  used: 'info',
  expired: 'warning',
}

function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`details-pill details-pill--${tone}`}>{children}</span>
}

// ---- Resumo ----

function CampaignSummaryCard({ details }: { details: CampaignDetails }) {
  return <section className="details-summary" aria-label="Resumo da campanha">
    <div className="details-summary-media" aria-hidden="true">
      {details.imageUrl ? <img src={details.imageUrl} alt="" /> : <Megaphone size={40} />}
    </div>
    <div className="details-summary-body">
      <div className="details-summary-text">
        <p className="details-summary-meta">
          <span className="details-summary-category">{details.category}</span>
          <StatusPill tone={campaignStatusTones[details.status]}>{statusLabels[details.status]}</StatusPill>
        </p>
        <h2>{details.name}</h2>
        <p className="details-summary-description">{details.description}</p>
      </div>
      {details.benefitLabel && <div className="details-summary-benefit">
        <span>Benefício da campanha</span>
        <strong>{details.benefitLabel}</strong>
        <small>Até {formatShortDate(details.endsAt)}</small>
      </div>}
    </div>
  </section>
}

// ---- Indicadores ----

interface MetricCard {
  title: string
  value: string
  caption: string
  icon: LucideIcon
  tone: 'brand' | 'info' | 'success' | 'warning'
}

function CampaignMetricCards({ details }: { details: CampaignDetails }) {
  const metrics = getCampaignMetrics(details.metrics)
  const cards: MetricCard[] = [
    {
      title: 'Vouchers emitidos',
      value: formatNumber(metrics.issued),
      caption: metrics.limitUsagePercent === null || metrics.issueLimit === null
        ? 'Emitidos nesta campanha'
        : `${formatPercent(metrics.limitUsagePercent)} do limite de ${formatNumber(metrics.issueLimit)}`,
      icon: Ticket,
      tone: 'brand',
    },
    { title: 'Vouchers utilizados', value: formatNumber(metrics.used), caption: 'Validações confirmadas', icon: CircleCheck, tone: 'info' },
    { title: 'Ainda disponíveis', value: formatNumber(metrics.available), caption: 'Emitidos e não utilizados', icon: Ticket, tone: 'success' },
    {
      title: 'Vouchers expirados',
      value: formatNumber(metrics.expired),
      caption: metrics.expired === 0 ? 'Sem utilização' : 'Prazo vencido sem uso',
      icon: Clock,
      tone: 'warning',
    },
    {
      title: 'Taxa de utilização',
      value: formatPercent(metrics.useRatePercent),
      caption: `${formatNumber(metrics.used)} de ${formatNumber(metrics.issued)} emitidos`,
      icon: ChartNoAxesColumn,
      tone: 'brand',
    },
  ]

  return <section className="details-metrics" aria-labelledby="details-metrics-title">
    <div className="details-metrics-heading">
      <h2 id="details-metrics-title">Desempenho da campanha</h2>
      <p>Acumulado desde o início · Demonstração</p>
    </div>
    <div className="details-metrics-grid">
      {cards.map(({ title, value, caption, icon: Icon, tone }) => <article className="details-metric" key={title} aria-label={title}>
        <div className="details-metric-top">
          <h3>{title}</h3>
          <span className={`details-metric-icon details-metric-icon--${tone}`}>
            <Icon size={17} aria-hidden="true" />
          </span>
        </div>
        <strong>{value}</strong>
        <p>{caption}</p>
      </article>)}
    </div>
  </section>
}

// ---- Vigência e validade ----

const phaseLabels: Record<CampaignPhase, string> = {
  scheduled: 'Agendada',
  running: 'Em andamento',
  ended: 'Encerrada',
}

function CampaignSchedulePanels({ details }: { details: CampaignDetails }) {
  const timing = getCampaignTiming(details.startsAt, details.endsAt, details.referenceAt)
  const { voucherValidity, lastUsedVoucher } = details
  const isPaused = details.status === 'paused'

  return <div className="details-panels">
    <section className="details-panel" aria-labelledby="details-schedule-title">
      <div className="details-panel-heading">
        <h2 id="details-schedule-title">Vigência da campanha</h2>
        <StatusPill tone={isPaused ? campaignStatusTones.paused : campaignStatusTones[details.status]}>
          {isPaused ? statusLabels.paused : phaseLabels[timing.phase]}
        </StatusPill>
      </div>

      <div className="details-countdown">
        <span className="details-countdown-icon"><CalendarClock size={22} aria-hidden="true" /></span>
        {timing.phase === 'running' && <div>
          <strong>
            {timing.days} {timing.days === 1 ? 'dia' : 'dias'}{' '}
            <small>para encerrar</small>
          </strong>
          <p>Mais {timing.hours}h {timing.minutes}min · emissão de vouchers {isPaused ? 'pausada' : 'ativa'}</p>
        </div>}
        {timing.phase === 'scheduled' && <div>
          <strong>Campanha ainda não iniciada</strong>
          <p>Começa em {formatDateTime(details.startsAt)}</p>
        </div>}
        {timing.phase === 'ended' && <div>
          <strong>Campanha encerrada</strong>
          <p>Encerrada em {formatDateTime(details.endsAt)}</p>
        </div>}
      </div>

      <progress className="details-progress" max={100} value={Math.round(timing.progress)} aria-label="Progresso da vigência" />

      <dl className="details-dates">
        <div>
          <dt>Início</dt>
          <dd>{formatDateTime(details.startsAt)}</dd>
        </div>
        <div>
          <dt>Encerramento</dt>
          <dd>{formatDateTime(details.endsAt)}</dd>
        </div>
      </dl>
      <p className="details-panel-note">
        {timing.phase === 'ended'
          ? 'A emissão de novos vouchers foi encerrada.'
          : 'Após o encerramento, não serão emitidos novos vouchers.'}
      </p>
    </section>

    <section className="details-panel" aria-labelledby="details-validity-title">
      <div className="details-panel-heading">
        <h2 id="details-validity-title">Validade dos vouchers</h2>
        <span className="details-panel-aside">{voucherValidity.model}</span>
      </div>
      <p className="details-validity-label">{voucherValidity.label}</p>
      <p className="details-panel-note">{voucherValidity.note}</p>

      <hr className="details-divider" />

      {lastUsedVoucher ? <div>
        <p className="details-last-voucher-head">
          <span>Último voucher utilizado</span>
          <span>Demonstração</span>
        </p>
        <p className="details-last-voucher-code">
          <span>{lastUsedVoucher.code}</span>
          <StatusPill tone={voucherStatusTones.used}>Utilizado</StatusPill>
        </p>
        <dl className="details-dates">
          <div>
            <dt>Data de validação</dt>
            <dd>{formatDateTime(lastUsedVoucher.validatedAt)}</dd>
          </div>
          <div>
            <dt>Cliente</dt>
            <dd>{lastUsedVoucher.customerMask}</dd>
          </div>
        </dl>
      </div> : <p className="details-panel-note">Nenhum voucher utilizado até o momento.</p>}
    </section>
  </div>
}

// ---- Últimos vouchers ----

interface VoucherTableProps {
  vouchers: readonly CampaignVoucher[]
  totalIssued: number
}

const columns = ['Código', 'Cliente', 'Data de emissão', 'Validade', 'Usos', 'Status']
const vouchersPath = '/vouchers'

function VoucherTable({ vouchers, totalIssued }: VoucherTableProps) {
  function handleViewAll(event: MouseEvent<HTMLAnchorElement>) {
    // Ctrl/Cmd/Shift/Alt e botão do meio mantêm o comportamento nativo (nova aba/janela).
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(vouchersPath)
  }

  return <section className="details-vouchers" aria-labelledby="details-vouchers-title">
    <div className="details-vouchers-head">
      <div>
        <h2 id="details-vouchers-title">Últimos vouchers emitidos</h2>
        <p>Somente desta campanha · registros de demonstração</p>
      </div>
      <a className="details-vouchers-link" href={vouchersPath} onClick={handleViewAll}>
        Ver todos os vouchers
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>

    {vouchers.length === 0 ? <EmptyState
      icon={Ticket}
      title="Nenhum voucher emitido"
      description="Os vouchers emitidos por esta campanha aparecerão aqui."
    /> : <>
      <div className="details-vouchers-scroll">
        <table className="details-vouchers-table" aria-labelledby="details-vouchers-title">
          <thead>
            <tr>
              {columns.map(label => <th key={label} scope="col">{label}</th>)}
              <th scope="col"><span className="details-sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(voucher => <tr key={voucher.code}>
              <th scope="row">{voucher.code}</th>
              <td>{voucher.customerMask}</td>
              <td className="details-vouchers-muted">{formatDateTime(voucher.issuedAt)}</td>
              <td className="details-vouchers-muted">{formatDateTime(voucher.expiresAt)}</td>
              <td>{voucher.uses}/{voucher.maxUses}</td>
              <td><StatusPill tone={voucherStatusTones[voucher.status]}>{voucherStatusLabels[voucher.status]}</StatusPill></td>
              <td><CampaignActionsMenu campaign={{ name: voucher.code }} /></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <footer className="details-vouchers-footer">
        <p>{vouchers.length} {vouchers.length === 1 ? 'registro mais recente' : 'registros mais recentes'} de {formatNumber(totalIssued)} vouchers emitidos</p>
        <p>Ordenados por emissão, do mais recente ao mais antigo</p>
      </footer>
    </>}
  </section>
}

// ---- Informações detalhadas ----

function CampaignInfoSections({ sections }: { sections: readonly CampaignInfoSection[] }) {
  return <section className="details-info" aria-labelledby="details-info-title">
    <div className="details-info-head">
      <h2 id="details-info-title">Informações detalhadas</h2>
      <p>Configuração ilustrativa baseada no fluxo de criação</p>
    </div>
    <div className="details-info-grid">
      {sections.map(section => <div key={section.title}>
        <h3>{section.title}</h3>
        <dl>
          {section.items.map(item => <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>)}
        </dl>
      </div>)}
    </div>
  </section>
}

// ---- Página ----

export interface CampaignDetailsPageProps {
  campaignId: string
}

const campaignsPath = '/campanhas'
const title = 'Detalhes da campanha'

export function CampaignDetailsPage({ campaignId }: CampaignDetailsPageProps) {
  const feedback = useFeedback()
  const details = useMemo(() => getCampaignDetails(campaignId), [campaignId])

  function handleComingSoon() {
    feedback.info({
      title: 'Ação em breve',
      description: 'Pausar, retomar e editar campanhas serão liberados em uma próxima etapa.',
    })
  }

  function handleBackToCampaigns() {
    navigate(campaignsPath)
  }

  const breadcrumbs = [
    { label: 'Portal' },
    { label: 'Campanhas', href: campaignsPath },
    { label: title },
  ]

  if (!details) {
    return <PortalLayout activeSection="campaigns">
      <PageHeader title={title} breadcrumbs={breadcrumbs} />
      <EmptyState
        title="Campanha não encontrada"
        description="Verifique o endereço ou volte para a listagem de campanhas."
        action={<Button variant="secondary" onPress={handleBackToCampaigns}>Voltar para campanhas</Button>}
      />
    </PortalLayout>
  }

  const isPaused = details.status === 'paused'
  const canTogglePause = details.status !== 'ended'

  return <PortalLayout activeSection="campaigns">
    <PageHeader
      title={title}
      breadcrumbs={breadcrumbs}
      action={<div className="details-actions">
        {canTogglePause && <Button
          className="details-action"
          variant="secondary"
          startIcon={isPaused ? Play : Pause}
          onPress={handleComingSoon}
        >{isPaused ? 'Retomar' : 'Pausar'}</Button>}
        <Button
          className="details-action"
          variant="secondary"
          startIcon={SquarePen}
          onPress={handleComingSoon}
        >Editar campanha</Button>
        <CampaignActionsMenu campaign={{ name: details.name }} />
      </div>}
    />
    <div className="details-page">
      <CampaignSummaryCard details={details} />
      <p className="details-notice">
        <Info size={14} aria-hidden="true" />
        Dados de demonstração: desempenho, vouchers e configuração ilustrativos. Referência temporal: {formatDateTime(details.referenceAt, ', ')}.
      </p>
      <CampaignMetricCards details={details} />
      <CampaignSchedulePanels details={details} />
      <VoucherTable vouchers={details.recentVouchers} totalIssued={details.metrics.issued} />
      <CampaignInfoSections sections={details.info} />
    </div>
  </PortalLayout>
}
