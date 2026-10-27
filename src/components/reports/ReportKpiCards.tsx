import { BadgeCheck, ChartNoAxesColumn, Clock, Ticket } from 'lucide-react'
import type { ReportKpis } from '../../types/report'
import { formatCount, formatPercent } from './reportFormatters'
import './ReportKpiCards.css'

export interface ReportKpiCardsProps {
  kpis: ReportKpis
}

export function ReportKpiCards({ kpis }: ReportKpiCardsProps) {
  const cards = [
    { id: 'issued', label: 'Vouchers emitidos', value: formatCount(kpis.issued), icon: Ticket },
    { id: 'redeemed', label: 'Vouchers resgatados', value: formatCount(kpis.redeemed), icon: BadgeCheck },
    { id: 'expired', label: 'Vouchers expirados e não utilizados', value: formatCount(kpis.expired), icon: Clock },
    { id: 'available', label: 'Vouchers ainda disponíveis', value: formatCount(kpis.available), icon: Ticket },
    { id: 'rate', label: 'Taxa de utilização', value: formatPercent(kpis.utilizationRate), icon: ChartNoAxesColumn },
  ]

  return <section className="report-kpis" aria-label="Indicadores de vouchers">
    {cards.map(({ id, label, value, icon: Icon }) => <article key={id} className={`report-kpi-card report-kpi-${id}`}>
      <div>
        <h2>{label}</h2>
        <span className="report-kpi-icon"><Icon size={16} aria-hidden="true" /></span>
      </div>
      <strong>{value}</strong>
    </article>)}
  </section>
}
