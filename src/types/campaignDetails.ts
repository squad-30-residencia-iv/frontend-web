import type { CampaignStatus } from './campaign'

export type VoucherStatus = 'available' | 'used' | 'expired'

export const voucherStatusLabels: Record<VoucherStatus, string> = {
  available: 'Disponível',
  used: 'Utilizado',
  expired: 'Expirado',
}

export interface CampaignVoucher {
  code: string
  /** CPF já mascarado (ex.: ***.482.***-10). Nunca guardar o documento completo. */
  customerMask: string
  /** Data e hora ISO com fuso. */
  issuedAt: string
  expiresAt: string
  uses: number
  maxUses: number
  status: VoucherStatus
}

export interface CampaignInfoItem {
  label: string
  value: string
}

export interface CampaignInfoSection {
  title: string
  items: CampaignInfoItem[]
}

export interface CampaignVoucherMetrics {
  issued: number
  used: number
  expired: number
  /** Teto de emissão. null quando a campanha não tem limite informado. */
  issueLimit: number | null
}

export interface CampaignDetails {
  id: string
  category: string
  status: CampaignStatus
  name: string
  description: string
  /** Sem imagem, a tela mostra um bloco decorativo. */
  imageUrl?: string
  /** Ex.: "20% OFF". Sem valor, o bloco de benefício não aparece. */
  benefitLabel?: string
  /** Datas e horas ISO com fuso (aaaa-mm-ddThh:mm:ss-03:00). */
  startsAt: string
  endsAt: string
  /** "Agora" da demonstração: mantém os cálculos de tempo estáveis. */
  referenceAt: string
  voucherValidity: { model: string; label: string; note: string }
  metrics: CampaignVoucherMetrics
  lastUsedVoucher: { code: string; validatedAt: string; customerMask: string } | null
  recentVouchers: CampaignVoucher[]
  info: CampaignInfoSection[]
}
