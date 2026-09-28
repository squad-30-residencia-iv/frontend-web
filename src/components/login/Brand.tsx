import './Brand.css'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="brand-icon-image">
          <path strokeLinejoin="round" d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0M3 20h18M10 20v-6h4v6M5 4V2h14v2" />
        </svg>
      </span>
      <div>
        <p className="brand-title">Portal Campanhas</p>
        <p className="brand-subtitle">Retail Management</p>
      </div>
    </div>
  )
}
