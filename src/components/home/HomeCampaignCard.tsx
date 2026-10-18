import { statusLabels } from '../../types/campaign'
import type { HomeCampaign } from '../../types/home'
import { getCategoryIcon } from './categoryIcons'
import { formatNumber, formatPeriod } from './formatters'
import './HomeCampaignCard.css'

export interface HomeCampaignCardProps {
  campaign: HomeCampaign
  categoryLabel: string
}

export function HomeCampaignCard({ campaign, categoryLabel }: HomeCampaignCardProps) {
  const titleId = `home-card-title-${campaign.id}`
  const CategoryIcon = getCategoryIcon(campaign.categoryId)

  return (
    <article className="home-card" aria-labelledby={titleId}>
      <div className="home-card-top">
        <span className="home-card-category">
          <span className="home-card-icon">
            <CategoryIcon size={16} aria-hidden="true" />
          </span>
          {categoryLabel}
        </span>
        <span className={`home-card-status home-card-status--${campaign.status}`}>{statusLabels[campaign.status]}</span>
      </div>
      <h3 className="home-card-title" id={titleId}>{campaign.name}</h3>
      <p className="home-card-description">{campaign.description}</p>
      <p className="home-card-benefit">{campaign.benefit}</p>
      <dl className="home-card-details">
        <div>
          <dt>Vigência</dt>
          <dd>{formatPeriod(campaign.start, campaign.end)}</dd>
        </div>
        <div>
          <dt>Vouchers</dt>
          <dd>{formatNumber(campaign.vouchers)}</dd>
        </div>
      </dl>
      <div className={`home-card-usage ${campaign.status === 'paused' ? 'home-card-usage--paused' : ''}`}>
        <progress max={100} value={campaign.usage} aria-label={`Utilização de ${campaign.name}`} />
        <span>{campaign.usage}% utilizado</span>
      </div>
    </article>
  )
}
