import type { ReportMonthlyPoint } from '../../types/report'
import { formatCount } from './reportFormatters'
import './ReportCharts.css'

export interface ReportBarChartProps {
  data: readonly ReportMonthlyPoint[]
}

const width = 560
const height = 240
const margin = { top: 12, right: 8, bottom: 28, left: 44 }
const series = [
  { key: 'issued', label: 'Emitidos' },
  { key: 'redeemed', label: 'Resgatados' },
  { key: 'expired', label: 'Expirados' },
] as const

/** Maior valor "redondo" (1, 2, 2,5, 5 × 10^n) que comporta o máximo, para o eixo Y. */
export function niceMax(max: number): number {
  if (max <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const step = [1, 2, 2.5, 5, 10].map(factor => factor * magnitude).find(value => value >= max) ?? 10 * magnitude
  return step
}

// Gráfico em SVG próprio (sem biblioteca). Os valores também ficam numa tabela só para leitores de tela.
export function ReportBarChart({ data }: ReportBarChartProps) {
  const hasData = data.some(point => point.issued > 0)
  const top = niceMax(Math.max(0, ...data.map(point => point.issued)))
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const groupWidth = plotWidth / Math.max(data.length, 1)
  const barWidth = Math.min(20, groupWidth / 4)
  const y = (value: number) => margin.top + plotHeight - (value / top) * plotHeight
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(fraction => fraction * top)

  return <section className="report-card report-bar-chart" aria-labelledby="report-bar-title">
    <header className="report-card-header">
      <h2 id="report-bar-title">Utilização de vouchers</h2>
      <ul className="report-legend report-legend-inline" aria-label="Legenda">
        {series.map(item => <li key={item.key}><span className={`report-dot report-series-${item.key}`} aria-hidden="true" />{item.label}</li>)}
      </ul>
    </header>
    {!hasData ? <p className="report-chart-empty">Sem dados de utilização para os filtros selecionados.</p> : <>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de barras mensal de vouchers emitidos, resgatados e expirados" className="report-bar-svg">
        {ticks.map(tick => <g key={tick}>
          <line className="report-grid-line" x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} />
          <text className="report-axis-label" x={margin.left - 8} y={y(tick) + 3} textAnchor="end">{formatCount(tick)}</text>
        </g>)}
        {data.map((point, index) => {
          const center = margin.left + groupWidth * index + groupWidth / 2
          const gap = 3
          const total = series.length * barWidth + (series.length - 1) * gap
          return <g key={point.month}>
            {series.map((item, seriesIndex) => {
              const value = point[item.key]
              const barHeight = margin.top + plotHeight - y(value)
              return <rect
                key={item.key}
                className={`report-bar report-series-${item.key}`}
                x={center - total / 2 + seriesIndex * (barWidth + gap)}
                y={y(value)}
                width={barWidth}
                height={barHeight}
                rx={2}
              ><title>{`${point.month} — ${item.label}: ${formatCount(value)}`}</title></rect>
            })}
            <text className="report-axis-label" x={center} y={height - 8} textAnchor="middle">{point.month}</text>
          </g>
        })}
      </svg>
      <table className="report-sr-only">
        <caption>Vouchers por mês</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Emitidos</th><th scope="col">Resgatados</th><th scope="col">Expirados</th></tr></thead>
        <tbody>{data.map(point => <tr key={point.month}>
          <th scope="row">{point.month}</th><td>{formatCount(point.issued)}</td><td>{formatCount(point.redeemed)}</td><td>{formatCount(point.expired)}</td>
        </tr>)}</tbody>
      </table>
    </>}
  </section>
}
