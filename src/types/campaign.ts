export const campaignStatuses = [
  'active', 'scheduled', 'paused', 'ended', 'draft', 'pending', 'rejected', 'cancelled', 'soldOut',
] as const
export type CampaignStatus = typeof campaignStatuses[number]
export type CampaignRole = 'analyst' | 'manager'
export type CampaignAction = 'submit' | 'approve' | 'reject' | 'pause' | 'end'
export interface Campaign {
  id: string
  name: string
  start: string
  end: string
  scope: string
  vouchers: number
  usage: number
  status: CampaignStatus
  rejectionReason?: string
}
export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Ativa', scheduled: 'Agendada', paused: 'Pausada', ended: 'Encerrada',
  draft: 'Rascunho', pending: 'Pendente de aprovação', rejected: 'Reprovada',
  cancelled: 'Cancelada', soldOut: 'Esgotada',
}

export interface CampaignBenefit {
  type: 'percentage' | 'fixed'
  value: string
  maximumDiscount?: string
}

export interface CampaignCondition {
  id: string
  type: 'purchase-total' | ''
  operator: 'gte' | ''
  value: string
}

export interface CampaignRestriction {
  id: string
  type: 'purchase-value' | ''
  minimum: string
  maximum: string
}

export type CampaignChannel = 'physical' | 'virtual'

export interface CampaignDraft {
  information: {
    name: string
    start: string
    end: string
    voucherModel: 'relative' | ''
    voucherDurationDays: string
    voucherCap: 'unlimited' | ''
  }
  benefits: {
    discountType: 'percentage' | 'fixed'
    percentage: string
    maximumDiscount?: string
    fixedAmount: string
    addedBenefits: CampaignBenefit[]
    application: 'total' | 'specific'
    targetType: 'category' | 'product'
    targetIds: string[]
    maxVouchers: string
    generationMode: 'automatic' | 'batch'
    quantityPerGrant: string
    limitPerCustomer: string
    customerBase: string
    quantityPerCustomer: string
  }
  rules: {
    audience: 'all' | ''
    conditionMatch: 'all' | 'any'
    conditions: CampaignCondition[]
    restrictionMatch: 'all' | 'any'
    restrictions: CampaignRestriction[]
  }
  scope: {
    mode: 'network' | 'stores'
    networkChannels: CampaignChannel[]
    storeIds: string[]
    storeChannels: CampaignChannel[]
  }
}
