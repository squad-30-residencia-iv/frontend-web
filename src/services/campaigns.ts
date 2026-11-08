import { api } from './api'
import type { Campaign, CampaignStatus } from '../types/campaign'
import type { FeaturedCampaign, HomeCampaign, HomeOverview } from '../types/home'

export interface ApiCampaignItem {
  benefitType: string
  benefitValue: number
  categoryId: string | null
}

export interface ApiCampaign {
  id: string
  name: string
  description: string | null
  startsAt: string
  endsAt: string
  status: string
  totalVoucherLimit: number | null
  items: ApiCampaignItem[]
}

const statusByApiName: Record<string, CampaignStatus> = {
  Draft: 'draft',
  PendingApproval: 'pending',
  Scheduled: 'scheduled',
  Active: 'active',
  Paused: 'paused',
  Ended: 'ended',
  Cancelled: 'cancelled',
  SoldOut: 'soldOut',
}

const amountFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readItem(value: unknown): ApiCampaignItem | null {
  if (!isRecord(value) || typeof value.benefitType !== 'string' || typeof value.benefitValue !== 'number') {
    return null
  }
  return {
    benefitType: value.benefitType,
    benefitValue: value.benefitValue,
    categoryId: typeof value.categoryId === 'string' ? value.categoryId : null,
  }
}

export function readApiCampaign(value: unknown): ApiCampaign {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || typeof value.startsAt !== 'string'
    || typeof value.endsAt !== 'string'
    || typeof value.status !== 'string'
    || !Array.isArray(value.items)
  ) {
    throw new Error('Resposta inesperada do servidor.')
  }

  return {
    id: value.id,
    name: value.name,
    description: typeof value.description === 'string' ? value.description : null,
    startsAt: value.startsAt,
    endsAt: value.endsAt,
    status: value.status,
    totalVoucherLimit: typeof value.totalVoucherLimit === 'number' ? value.totalVoucherLimit : null,
    items: value.items.map(readItem).filter((item): item is ApiCampaignItem => item !== null),
  }
}

function businessDate(value: string): string {
  return value.slice(0, 10)
}

function mapStatus(status: string): CampaignStatus {
  return statusByApiName[status] ?? 'draft'
}

export function formatBenefit(item: ApiCampaignItem | undefined): string {
  if (!item) return ''
  const amount = amountFormat.format(item.benefitValue)
  if (item.benefitType === 'Percentage') return `${amount}% OFF`
  if (item.benefitType === 'FixedAmount') return `R$ ${amount} OFF`
  return ''
}

export function toListCampaign(campaign: ApiCampaign): Campaign {
  return {
    id: campaign.id,
    name: campaign.name,
    start: businessDate(campaign.startsAt),
    end: businessDate(campaign.endsAt),
    scope: 'Rede',
    vouchers: campaign.totalVoucherLimit ?? 0,
    usage: 0,
    status: mapStatus(campaign.status),
  }
}

export function toHomeOverview(campaigns: readonly ApiCampaign[]): HomeOverview {
  const cards: HomeCampaign[] = campaigns.map(campaign => {
    const list = toListCampaign(campaign)
    return {
      ...list,
      description: campaign.description ?? '',
      categoryId: campaign.items.find(item => item.categoryId)?.categoryId ?? 'uncategorized',
      benefit: formatBenefit(campaign.items[0]),
    }
  })
  const first = cards[0]
  const featured: FeaturedCampaign | null = first
    ? {
        id: first.id,
        title: first.name,
        description: first.description,
        benefit: first.benefit,
        start: first.start,
        end: first.end,
        ctaLabel: 'Ver campanha',
        ctaPath: `/campanhas/${first.id}`,
      }
    : null

  return { featured, categories: [], campaigns: cards }
}

/** Lista da rede. Sem rede, devolve vazio e não chama a API. */
export async function fetchNetworkCampaigns(networkId: string | null): Promise<ApiCampaign[]> {
  if (!networkId) return []

  const { data } = await api.get<unknown>('/api/v1/campaigns', { params: { networkId } })
  if (!Array.isArray(data)) throw new Error('Resposta inesperada do servidor.')
  return data.map(readApiCampaign)
}

export async function loadHomeFromSession(networkId: string | null): Promise<HomeOverview> {
  return toHomeOverview(await fetchNetworkCampaigns(networkId))
}
