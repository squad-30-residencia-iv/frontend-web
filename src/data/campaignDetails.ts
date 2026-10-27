import { campaigns as mockCampaigns } from './campaigns'
import { loadCreatedCampaigns } from './campaignRepository'
import { homeOverview } from './homeOverview'
import type { Campaign, CampaignStatus } from '../types/campaign'
import type { CampaignDetails, CampaignInfoSection, CampaignVoucher, CampaignVoucherMetrics, VoucherStatus } from '../types/campaignDetails'

/** Campanha de referência do protótipo. Não consta na listagem: abra em /campanhas/material-novo-ideias-novas. */
export const referenceCampaignId = 'material-novo-ideias-novas'

const MINUTE = 60_000
const DAY = 86_400_000
const VOUCHER_VALIDITY_DAYS = 30
const customerMasks = ['***.482.***-10', '***.915.***-88', '***.203.***-55', '***.671.***-33', '***.148.***-92']
// Minutos entre a emissão de cada voucher recente e o último registro.
const issueOffsetsInMinutes = [0, 13, 28, 50, 66]

function referenceVoucher(code: string, maskIndex: number, time: string, status: VoucherStatus): CampaignVoucher {
  return {
    code,
    customerMask: customerMasks[maskIndex],
    issuedAt: `2026-10-05T${time}:00-03:00`,
    expiresAt: `2026-11-04T${time}:00-03:00`,
    uses: status === 'used' ? 1 : 0,
    maxUses: 1,
    status,
  }
}

const referenceDetails: CampaignDetails = {
  id: referenceCampaignId,
  category: 'Papelaria',
  status: 'active',
  name: 'Material novo, ideias novas',
  description: 'Cadernos, estojos e itens criativos para renovar sua rotina.',
  benefitLabel: '20% OFF',
  startsAt: '2026-10-01T08:00:00-03:00',
  endsAt: '2026-10-31T23:59:00-03:00',
  referenceAt: '2026-10-05T12:00:00-03:00',
  voucherValidity: {
    model: 'Prazo relativo',
    label: '30 dias após a emissão',
    note: 'Sem teto máximo · independente da vigência da campanha.',
  },
  metrics: { issued: 1240, used: 496, expired: 0, issueLimit: 5000 },
  lastUsedVoucher: { code: 'VCH-PAP1238', validatedAt: '2026-10-05T11:52:00-03:00', customerMask: '***.203.***-55' },
  recentVouchers: [
    referenceVoucher('VCH-PAP1240', 0, '11:48', 'available'),
    referenceVoucher('VCH-PAP1239', 1, '11:35', 'available'),
    referenceVoucher('VCH-PAP1238', 2, '11:20', 'used'),
    referenceVoucher('VCH-PAP1237', 3, '10:58', 'available'),
    referenceVoucher('VCH-PAP1236', 4, '10:42', 'available'),
  ],
  info: [
    {
      title: 'Alvos e benefícios',
      items: [
        { label: 'Aplicação do desconto', value: '20% sobre o valor total da compra' },
        { label: 'Quantidade máxima / por cliente', value: '5.000 vouchers / 1 voucher' },
        { label: 'Forma de geração', value: 'Automática · 1 por concessão' },
      ],
    },
    {
      title: 'Regras e público',
      items: [
        { label: 'Público elegível', value: 'Todos os clientes' },
        { label: 'Condição de geração', value: 'Compra maior ou igual a R$ 200,00' },
        { label: 'Restrição de uso', value: 'Compra mínima de R$ 100,00 · sem máximo' },
      ],
    },
    {
      title: 'Escopo e canais',
      items: [
        { label: 'Escopo organizacional', value: 'Toda a rede (exemplo)' },
        { label: 'Canais habilitados', value: 'Físico e virtual (exemplo)' },
        { label: 'Combinação das regras', value: 'Todas as condições e restrições — E' },
      ],
    },
  ],
}

function toIso(date: string, time: string) {
  return `${date}T${time}-03:00`
}

// A listagem usa datas de 2024 com status variados. A referência acompanha o status
// para a tela mostrar sempre um estado coerente (ex.: ativa = no meio da vigência).
function getReferenceAt(status: CampaignStatus, startsAt: string, endsAt: string) {
  const start = Date.parse(startsAt)
  const end = Date.parse(endsAt)
  const middle = start + Math.round(((end - start) * 0.6) / MINUTE) * MINUTE
  const reference = status === 'scheduled' ? start - 5 * DAY : status === 'ended' ? end + DAY : middle
  return new Date(reference).toISOString()
}

function getVoucherPrefix(name: string) {
  const letters = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '')
  return letters.slice(0, 3).padEnd(3, 'X')
}

function buildRecentVouchers(campaign: Campaign, used: number, startsAt: string, endsAt: string, referenceAt: string) {
  const count = Math.min(5, campaign.vouchers)
  const lastEmission = Math.min(Math.max(Date.parse(referenceAt), Date.parse(startsAt)), Date.parse(endsAt))
  const usedIndex = Math.min(2, count - 1)
  const prefix = getVoucherPrefix(campaign.name)

  return Array.from({ length: count }, (_, index): CampaignVoucher => {
    const issuedAt = lastEmission - issueOffsetsInMinutes[index] * MINUTE
    const isUsed = used > 0 && index === usedIndex
    return {
      code: `VCH-${prefix}${campaign.vouchers - index}`,
      customerMask: customerMasks[index],
      issuedAt: new Date(issuedAt).toISOString(),
      expiresAt: new Date(issuedAt + VOUCHER_VALIDITY_DAYS * DAY).toISOString(),
      uses: isUsed ? 1 : 0,
      maxUses: 1,
      status: isUsed ? 'used' : 'available',
    }
  })
}

function buildInfoSections(campaign: Campaign): CampaignInfoSection[] {
  return [
    {
      title: 'Alvos e benefícios',
      items: [
        { label: 'Aplicação do desconto', value: 'Sobre o valor total da compra (exemplo)' },
        { label: 'Quantidade máxima / por cliente', value: `${campaign.vouchers.toLocaleString('pt-BR')} vouchers / 1 voucher` },
        { label: 'Forma de geração', value: 'Automática · 1 por concessão' },
      ],
    },
    {
      title: 'Regras e público',
      items: [
        { label: 'Público elegível', value: 'Todos os clientes' },
        { label: 'Condição de geração', value: 'Compra maior ou igual a R$ 200,00 (exemplo)' },
        { label: 'Restrição de uso', value: 'Compra mínima de R$ 100,00 · sem máximo (exemplo)' },
      ],
    },
    {
      title: 'Escopo e canais',
      items: [
        { label: 'Escopo organizacional', value: campaign.scope || 'Não informado' },
        { label: 'Canais habilitados', value: 'Físico e virtual (exemplo)' },
        { label: 'Combinação das regras', value: 'Todas as condições e restrições — E' },
      ],
    },
  ]
}

// Monta os detalhes de uma campanha da listagem. O que a listagem não tem
// (limite de emissão, validade, regras) é demonstrativo.
function deriveDetails(campaign: Campaign): CampaignDetails {
  const startsAt = toIso(campaign.start, '08:00:00')
  const endsAt = toIso(campaign.end, '23:59:00')
  const referenceAt = getReferenceAt(campaign.status, startsAt, endsAt)
  const used = Math.round((campaign.vouchers * campaign.usage) / 100)
  const recentVouchers = buildRecentVouchers(campaign, used, startsAt, endsAt, referenceAt)
  const usedVoucher = recentVouchers.find(voucher => voucher.status === 'used')
  const home = homeOverview.campaigns.find(item => item.id === campaign.id)
  const category = homeOverview.categories.find(item => item.id === home?.categoryId)?.label

  return {
    id: campaign.id,
    category: category ?? 'Campanha',
    status: campaign.status,
    name: campaign.name,
    description: home?.description ?? 'Descrição não cadastrada nesta demonstração.',
    benefitLabel: home?.benefit,
    startsAt,
    endsAt,
    referenceAt,
    voucherValidity: {
      model: 'Prazo relativo',
      label: `${VOUCHER_VALIDITY_DAYS} dias após a emissão`,
      note: 'Sem teto máximo · independente da vigência da campanha.',
    },
    metrics: { issued: campaign.vouchers, used, expired: 0, issueLimit: null },
    lastUsedVoucher: usedVoucher
      ? {
        code: usedVoucher.code,
        validatedAt: new Date(Date.parse(usedVoucher.issuedAt) + 32 * MINUTE).toISOString(),
        customerMask: usedVoucher.customerMask,
      }
      : null,
    recentVouchers,
    info: buildInfoSections(campaign),
  }
}

export function getCampaignDetails(campaignId: string): CampaignDetails | null {
  if (campaignId === referenceCampaignId) return referenceDetails
  const campaign = [...loadCreatedCampaigns(), ...mockCampaigns].find(item => item.id === campaignId)
  return campaign ? deriveDetails(campaign) : null
}

export type CampaignPhase = 'scheduled' | 'running' | 'ended'

export function getCampaignMetrics({ issued, used, expired, issueLimit }: CampaignVoucherMetrics) {
  return {
    issued,
    used,
    expired,
    issueLimit,
    available: Math.max(issued - used - expired, 0),
    limitUsagePercent: issueLimit ? (issued / issueLimit) * 100 : null,
    useRatePercent: issued > 0 ? (used / issued) * 100 : 0,
  }
}

// Tempo restante e progresso da vigência em relação a uma data de referência fixa.
export function getCampaignTiming(startsAt: string, endsAt: string, referenceAt: string) {
  const start = Date.parse(startsAt)
  const end = Date.parse(endsAt)
  const reference = Date.parse(referenceAt)

  const total = Math.max(end - start, 0)
  const elapsed = Math.min(Math.max(reference - start, 0), total)
  const remainingMinutes = Math.floor(Math.max(end - reference, 0) / MINUTE)
  const phase: CampaignPhase = reference < start ? 'scheduled' : reference > end ? 'ended' : 'running'

  return {
    phase,
    days: Math.floor(remainingMinutes / 1440),
    hours: Math.floor((remainingMinutes % 1440) / 60),
    minutes: remainingMinutes % 60,
    progress: total > 0 ? (elapsed / total) * 100 : 0,
  }
}
