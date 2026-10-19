import type { Campaign } from './campaign'

export interface HomeCategory {
  id: string
  label: string
}

export interface FeaturedCampaign {
  id: string
  title: string
  description: string
  benefit: string
  /** Data ISO (aaaa-mm-dd). */
  start: string
  /** Data ISO (aaaa-mm-dd). */
  end: string
  ctaLabel: string
  ctaPath: string
}

export interface HomeCampaign
  extends Pick<Campaign, 'id' | 'name' | 'start' | 'end' | 'status' | 'vouchers' | 'usage'> {
  description: string
  categoryId: string
  benefit: string
}

export interface HomeOverview {
  featured: FeaturedCampaign
  categories: HomeCategory[]
  campaigns: HomeCampaign[]
}
