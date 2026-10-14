export type CampaignStatus = 'active' | 'scheduled' | 'paused' | 'ended'
export interface Campaign {
  id: string
  name: string
  start: string
  end: string
  scope: string
  vouchers: number
  usage: number
  status: CampaignStatus
}
export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Ativa', scheduled: 'Agendada', paused: 'Pausada', ended: 'Encerrada',
}

export interface CampaignBenefit {
  type: 'percentage' | 'fixed'
  value: string
}

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
}
