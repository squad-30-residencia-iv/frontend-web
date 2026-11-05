import type { CampaignRole } from './campaign'

export interface PortalUser {
  name: string
  role: string
  campaignRole?: CampaignRole
  avatarUrl?: string
}
