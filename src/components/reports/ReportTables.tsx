import type { ReportCampaignRow, ReportRegionRow } from '../../types/report'
import { formatCount, formatCurrency, formatPercent } from './reportFormatters'
import './ReportTables.css'

export function TopCampaignsTable({ rows }: { rows: readonly ReportCampaignRow[] }) {
  return <section className="report-card report-table-card" aria-labelledby="report-top-title">
    <h2 id="report-top-title">Top 5 campanhas por utilização</h2>
    {rows.length === 0 ? <p className="report-table-empty">Sem campanhas com vouchers para os filtros selecionados.</p>
      : <div className="report-table-scroll" tabIndex={0} role="region" aria-label="Tabela de campanhas com rolagem horizontal">
        <table className="report-table">
          <thead><tr>
            <th scope="col">#</th><th scope="col">Campanha</th>
            <th scope="col" className="report-number">Emit.</th><th scope="col" className="report-number">Resg.</th><th scope="col" className="report-number">Taxa</th>
          </tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.campaignId}>
            <td>{index + 1}</td>
            <th scope="row">{row.name}</th>
            <td className="report-number">{formatCount(row.issued)}</td>
            <td className="report-number">{formatCount(row.redeemed)}</td>
            <td className="report-number report-rate-brand">{formatPercent(row.rate, 0)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
  </section>
}

export function RegionPerformanceTable({ rows }: { rows: readonly ReportRegionRow[] }) {
  return <section className="report-card report-table-card" aria-labelledby="report-region-title">
    <h2 id="report-region-title">Desempenho por região</h2>
    {rows.length === 0 ? <p className="report-table-empty">Sem vouchers por região para os filtros selecionados.</p>
      : <div className="report-table-scroll" tabIndex={0} role="region" aria-label="Tabela de regiões com rolagem horizontal">
        <table className="report-table">
          <thead><tr>
            <th scope="col">Regional</th>
            <th scope="col" className="report-number">Vouchers</th><th scope="col" className="report-number">Utilização</th><th scope="col" className="report-number">Tkt Médio</th>
          </tr></thead>
          <tbody>{rows.map(row => <tr key={row.regionId}>
            <th scope="row">{row.name}</th>
            <td className="report-number">{formatCount(row.vouchers)}</td>
            <td className="report-number report-rate-success">{formatPercent(row.rate, 0)}</td>
            <td className="report-number">{formatCurrency(row.averageTicket)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
  </section>
}
