import type { ReportStatusSlice } from '../../types/report'
import { formatCount, statusLabels } from './reportFormatters'
import './ReportCharts.css'

export interface ReportStatusDonutProps {
  data: readonly ReportStatusSlice[]
}

const size = 180
const stroke = 24
const radius = (size - stroke) / 2
const circumference = 2 * Math.PI * radius

export function ReportStatusDonut({ data }: ReportStatusDonutProps) {
  const total = data.reduce((sum, slice) => sum + slice.count, 0)
  let offset = 0

  return <section className="report-card report-donut" aria-labelledby="report-donut-title">
    <header className="report-card-header">
      <h2 id="report-donut-title">Distribuição por status</h2>
    </header>
    <div className="report-donut-body">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Distribuição de ${formatCount(total)} vouchers por status`} className="report-donut-svg">
        <circle className="report-donut-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        {total > 0 && data.filter(slice => slice.count > 0).map(slice => {
          const length = (slice.count / total) * circumference
          const circle = <circle
            key={slice.status}
            className={`report-donut-slice report-status-${slice.status}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          ><title>{`${statusLabels[slice.status]}: ${formatCount(slice.count)}`}</title></circle>
          offset += length
          return circle
        })}
        <text className="report-donut-total" x={size / 2} y={size / 2 + 2} textAnchor="middle">{formatCount(total)}</text>
        <text className="report-donut-caption" x={size / 2} y={size / 2 + 18} textAnchor="middle">Total</text>
      </svg>
      <ul className="report-legend report-donut-legend" aria-label="Quantidade por status">
        {data.map(slice => <li key={slice.status}>
          <span className={`report-dot report-status-${slice.status}`} aria-hidden="true" />
          {statusLabels[slice.status]} {formatCount(slice.count)}
        </li>)}
      </ul>
    </div>
  </section>
}
