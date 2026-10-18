import { ArrowRight, CalendarDays, Percent } from 'lucide-react'
import type { FeaturedCampaign } from '../../types/home'
import { Button } from '../ui/Button'
import { formatDate } from './formatters'
import './FeaturedBanner.css'

export interface FeaturedBannerProps {
  campaign: FeaturedCampaign
  onOpen: (campaign: FeaturedCampaign) => void
}

export function FeaturedBanner({ campaign, onOpen }: FeaturedBannerProps) {
  return (
    <section className="home-banner" aria-labelledby="home-banner-title">
      <p className="home-banner-eyebrow">DESTAQUE DA SEMANA</p>
      <h2 className="home-banner-title" id="home-banner-title">{campaign.title}</h2>
      <p className="home-banner-description">{campaign.description}</p>
      <ul className="home-banner-meta">
        <li>
          <Percent size={14} aria-hidden="true" />
          {campaign.benefit}
        </li>
        <li>
          <CalendarDays size={14} aria-hidden="true" />
          {formatDate(campaign.start)} a {formatDate(campaign.end)}
        </li>
      </ul>
      <Button
        className="home-banner-action"
        endIcon={ArrowRight}
        onPress={() => onOpen(campaign)}
      >{campaign.ctaLabel}</Button>
    </section>
  )
}
