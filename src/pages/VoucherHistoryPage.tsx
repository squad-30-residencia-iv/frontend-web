import { useEffect, useState } from 'react'
import { ChevronLeft, Ticket, TriangleAlert } from 'lucide-react'
import { PageHeader } from '../components/shared/PageHeader'
import { PortalLayout } from '../components/layout/PortalLayout'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { loadVoucherHistory } from '../data/voucherHistory'
import { voucherStatusLabels } from '../data/vouchers'
import { navigate } from '../navigation/navigate'
import { voucherEventLabels, type VoucherHistory } from '../types/voucherHistory'
import './VoucherHistoryPage.css'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'not-found' } | { status: 'success'; history: VoucherHistory }
export interface VoucherHistoryPageProps {
  voucherId: string
  /** Ponto único de troca do mock por uma API. */
  loadHistory?: (voucherId: string) => Promise<VoucherHistory | null>
}

const vouchersPath = '/vouchers'
const summaryColumns = ['Código', 'Campanha de origem', 'Cliente', 'Data de emissão', 'Validade', 'Usos', 'Status', 'Benefício']
const timelineColumns = ['Movimentação', 'Data/Hora', 'Origem', 'Canal/Local', 'Resultado']

// "2026-09-10" -> "10/09/2026"
const formatDate = (value: string) => value.split('-').reverse().join('/')
// "2026-11-20T14:30" -> "20/11 às 14h30"
function formatEventDate(value: string) {
  const [date, time] = value.split('T')
  const [, month, day] = date.split('-')
  return `${day}/${month} às ${time.replace(':', 'h')}`
}
const goToVouchers = () => navigate(vouchersPath)

export function VoucherHistoryPage({ voucherId, loadHistory = loadVoucherHistory }: VoucherHistoryPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => loadHistory(voucherId)).then(history => {
      if (!cancelled) setState(history ? { status: 'success', history } : { status: 'not-found' })
    }).catch(() => {
      if (!cancelled) setState({ status: 'error' })
    })
    return () => { cancelled = true }
  }, [loadHistory, voucherId, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt(value => value + 1)
  }

  return <PortalLayout activeSection="vouchers">
    <PageHeader
      title="Histórico do voucher"
      subtitle="Consulte os eventos de emissão, utilização, expiração e cancelamento."
      breadcrumbs={[{ label: 'Portal' }, { label: 'Vouchers', href: vouchersPath }, { label: 'Histórico' }]}
    />
    <div className="voucher-history" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' && <Loading message="Carregando histórico do voucher…" />}
      {state.status === 'error' && <div role="alert">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível carregar o histórico"
          description="Tente carregar os dados novamente."
          action={<div className="voucher-history-recovery">
            <Button variant="secondary" onPress={retry}>Tentar novamente</Button>
            <Button variant="ghost" onPress={goToVouchers}>Voltar para vouchers</Button>
          </div>}
        />
      </div>}
      {state.status === 'not-found' && <EmptyState
        icon={Ticket}
        title="Voucher não encontrado"
        description="Não existe histórico para o código informado. Volte para a consulta de vouchers."
        action={<Button variant="secondary" onPress={goToVouchers}>Voltar para vouchers</Button>}
      />}
      {state.status === 'success' && <VoucherHistoryContent history={state.history} />}
    </div>
  </PortalLayout>
}

function VoucherHistoryContent({ history }: { history: VoucherHistory }) {
  const { voucher, benefit, scope, events } = history

  return <>
    <section aria-labelledby="voucher-history-summary-title">
      <h2 id="voucher-history-summary-title">Resumo</h2>
      <div className="voucher-history-card voucher-history-scroll">
        <table className="voucher-history-table" aria-labelledby="voucher-history-summary-title">
          <thead>
            <tr>{summaryColumns.map(label => <th key={label} scope="col">{label}</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{voucher.code}</th>
              <td>{voucher.campaignName}</td>
              <td>{voucher.clientIdentification}</td>
              <td className="voucher-history-muted">{formatDate(voucher.issuedAt)}</td>
              <td className="voucher-history-muted">{formatDate(voucher.expiresAt)}</td>
              <td>{voucher.uses}/{voucher.usageLimit}</td>
              <td><span className={`voucher-history-status voucher-history-status--${voucher.status}`}>{voucherStatusLabels[voucher.status]}</span></td>
              <td className="voucher-history-muted">{benefit}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="voucher-history-scope-title">
      <h2 id="voucher-history-scope-title">Escopo e Regras de utilização</h2>
      <p className="voucher-history-intro">Onde o voucher pode ser utilizado:</p>
      <ul className="voucher-history-card voucher-history-scope">
        {scope.map(item => <li key={item.label}>{item.label}: {item.value}.</li>)}
      </ul>
    </section>

    <section aria-labelledby="voucher-history-timeline-title">
      <h2 id="voucher-history-timeline-title">Linha do tempo das movimentações</h2>
      <div className="voucher-history-card">
        <div className="voucher-history-scroll">
          <table className="voucher-history-table" aria-labelledby="voucher-history-timeline-title">
            <thead>
              <tr>{timelineColumns.map(label => <th key={label} scope="col">{label}</th>)}</tr>
            </thead>
            <tbody>
              {events.map(event => <tr key={event.id}>
                <th scope="row">{voucherEventLabels[event.type]}</th>
                <td className="voucher-history-muted">{formatEventDate(event.occurredAt)}</td>
                <td>{event.origin}</td>
                <td>{event.place}</td>
                <td>{event.result}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="voucher-history-card-footer">
          <Button className="voucher-history-back" variant="secondary" isIconOnly aria-label="Voltar para vouchers" startIcon={ChevronLeft} onPress={goToVouchers} />
        </div>
      </div>
    </section>
  </>
}