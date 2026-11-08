import axios from 'axios'
import { api } from './api'
import { parseDiscount } from '../data/campaignBenefits'
import { writeSavedCampaignId } from '../data/campaignDraft'
import type { Campaign, CampaignStatus, CampaignDraft } from '../types/campaign'
import type { CampaignDetails, CampaignInfoSection } from '../types/campaignDetails'
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
  rejectionReason?: string | null
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
  Rejected: 'rejected',
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

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const genericSaveMessage = 'Não foi possível registrar a campanha. Seus dados continuam nesta tela; tente novamente.'
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function isCampaignGuid(value: string) {
  return guidPattern.test(value)
}

export function campaignPersistBlocker(draft: CampaignDraft): string | null {
  if (draft.benefits.addedBenefits.length > 0) {
    return 'A API grava um benefício por alvo. Remova os benefícios extras antes de salvar.'
  }
  if (draft.rules.conditionMatch === 'any') {
    return 'A API só grava condições que valem juntas. A combinação "qualquer" não é enviada.'
  }
  return null
}

export function campaignPersistNotices(draft: CampaignDraft): string[] {
  const notices = ['Base de clientes, quantidade por concessão e lojas e canais ficam só neste navegador.']
  if (draft.rules.restrictions.length > 1) notices.unshift('Só a primeira faixa de compra é gravada.')
  return notices
}

function problemMessage(data: unknown): string {
  if (!isRecord(data)) return genericSaveMessage
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  if (!isRecord(data.errors)) return genericSaveMessage
  for (const value of Object.values(data.errors)) {
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0]
  }
  return genericSaveMessage
}

function asSaveError(error: unknown): Error {
  if (axios.isAxiosError(error)) return new Error(problemMessage(error.response?.data))
  if (error instanceof Error) return error
  return new Error(genericSaveMessage)
}

function benefitAmount(draft: CampaignDraft) {
  const raw = draft.benefits.discountType === 'percentage' ? draft.benefits.percentage : draft.benefits.fixedAmount
  return parseDiscount(raw)
}

function itemBody(draft: CampaignDraft) {
  const benefitType = draft.benefits.discountType === 'percentage' ? 'Percentage' : 'FixedAmount'
  const benefitValue = benefitAmount(draft)
  if (draft.benefits.application === 'total') {
    return [{ targetType: 'All', categoryId: null, productId: null, benefitType, benefitValue, voucherLimit: null }]
  }
  const targetType = draft.benefits.targetType === 'category' ? 'Category' : 'Product'
  return draft.benefits.targetIds.map(id => ({
    targetType,
    categoryId: targetType === 'Category' ? id : null,
    productId: targetType === 'Product' ? id : null,
    benefitType,
    benefitValue,
    voucherLimit: null,
  }))
}

function optionalMoney(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const amount = parseDiscount(trimmed)
  return Number.isFinite(amount) ? amount : null
}

/** Grava o rascunho. Sem id, cria a campanha; com id, só repete os PUT. */
export async function saveCampaignDraft(networkId: string, draft: CampaignDraft, existingId: string | null) {
  const blocker = campaignPersistBlocker(draft)
  if (blocker) throw new Error(blocker)

  let id = existingId
  try {
    if (!id) {
      const { data } = await api.post<unknown>('/api/v1/campaigns', {
        networkId,
        name: draft.information.name.trim(),
        description: null,
        startsAt: draft.information.start,
        endsAt: draft.information.end,
      })
      id = readApiCampaign(data).id
      writeSavedCampaignId(id)
    }

    const perCustomer = draft.benefits.generationMode === 'batch'
      ? Number(draft.benefits.quantityPerCustomer)
      : Number(draft.benefits.limitPerCustomer)
    const firstRestriction = draft.rules.restrictions[0]
    await api.put(`/api/v1/campaigns/${id}/items`, { items: itemBody(draft) })
    await api.put(`/api/v1/campaigns/${id}/quantities`, {
      totalVoucherLimit: Number(draft.benefits.maxVouchers),
      perCustomerVoucherLimit: perCustomer,
    })
    await api.put(`/api/v1/campaigns/${id}/audience`, { audienceType: 'AllCustomers' })
    await api.put(`/api/v1/campaigns/${id}/voucher-validity`, {
      type: 'Relative',
      amount: Number(draft.information.voucherDurationDays),
      unit: 'Days',
      cap: null,
      validUntil: null,
    })
    await api.put(`/api/v1/campaigns/${id}/usage-restrictions`, {
      minPurchaseAmount: firstRestriction ? optionalMoney(firstRestriction.minimum) : null,
      maxPurchaseAmount: firstRestriction ? optionalMoney(firstRestriction.maximum) : null,
      maxUsesPerVoucher: 1,
    })
    await api.put(`/api/v1/campaigns/${id}/conditions`, {
      allowUseInSamePurchase: false,
      conditions: draft.rules.conditions
        .filter(condition => condition.type === 'purchase-total')
        .map(condition => ({
          type: 'PurchaseTotal',
          minAmount: parseDiscount(condition.value),
          minQuantity: null,
          categoryId: null,
          productId: null,
        })),
    })
  } catch (error) {
    throw asSaveError(error)
  }

  return { id, notices: campaignPersistNotices(draft) }
}

interface ApiValidity {
  type: string
  amount: number | null
  unit: string | null
  validUntil: string | null
  cap: string | null
}

interface ApiCondition {
  type: string
  minAmount: number | null
  minQuantity: number | null
  categoryId: string | null
  productId: string | null
}

interface ApiDetailItem extends ApiCampaignItem {
  targetType: string
  productId: string | null
}

interface ApiCampaignDetail extends ApiCampaign {
  perCustomerVoucherLimit: number | null
  audienceType: string | null
  voucherValidity: ApiValidity | null
  minPurchaseAmount: number | null
  maxPurchaseAmount: number | null
  maxUsesPerVoucher: number | null
  conditions: ApiCondition[]
  detailItems: ApiDetailItem[]
  rejectionReason: string | null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function readDetail(value: unknown): ApiCampaignDetail {
  const campaign = readApiCampaign(value)
  const record = isRecord(value) ? value : {}
  const validity = isRecord(record.voucherValidity) && typeof record.voucherValidity.type === 'string'
    ? {
        type: record.voucherValidity.type,
        amount: readNumber(record.voucherValidity.amount),
        unit: typeof record.voucherValidity.unit === 'string' ? record.voucherValidity.unit : null,
        validUntil: typeof record.voucherValidity.validUntil === 'string' ? record.voucherValidity.validUntil : null,
        cap: typeof record.voucherValidity.cap === 'string' ? record.voucherValidity.cap : null,
      }
    : null
  const conditions = Array.isArray(record.conditions) ? record.conditions.flatMap(item => {
    if (!isRecord(item) || typeof item.type !== 'string') return []
    return [{
      type: item.type,
      minAmount: readNumber(item.minAmount),
      minQuantity: readNumber(item.minQuantity),
      categoryId: typeof item.categoryId === 'string' ? item.categoryId : null,
      productId: typeof item.productId === 'string' ? item.productId : null,
    }]
  }) : []
  const detailItems = Array.isArray(record.items) ? record.items.flatMap(item => {
    const base = readItem(item)
    if (!base || !isRecord(item)) return []
    return [{
      ...base,
      targetType: typeof item.targetType === 'string' ? item.targetType : 'All',
      productId: typeof item.productId === 'string' ? item.productId : null,
    }]
  }) : []

  return {
    ...campaign,
    perCustomerVoucherLimit: readNumber(record.perCustomerVoucherLimit),
    audienceType: typeof record.audienceType === 'string' ? record.audienceType : null,
    voucherValidity: validity,
    minPurchaseAmount: readNumber(record.minPurchaseAmount),
    maxPurchaseAmount: readNumber(record.maxPurchaseAmount),
    maxUsesPerVoucher: readNumber(record.maxUsesPerVoucher),
    conditions,
    detailItems,
    rejectionReason: typeof record.rejectionReason === 'string' && record.rejectionReason.trim() ? record.rejectionReason.trim() : null,
  }
}

function moneyOrNone(value: number | null) {
  return value === null ? 'sem limite' : money.format(value)
}

function validityText(validity: ApiValidity | null): CampaignDetails['voucherValidity'] {
  if (!validity) return { model: 'Não definida', label: 'A validade ainda não foi gravada', note: '' }
  if (validity.type === 'FixedDate') {
    return { model: 'Data fixa', label: validity.validUntil?.slice(0, 16).replace('T', ' ') ?? 'Não informada', note: '' }
  }
  const unit = validity.unit === 'Hours' ? 'horas' : 'dias'
  const cap = validity.cap ? `Teto em ${validity.cap.slice(0, 16).replace('T', ' ')}` : 'Sem teto'
  return { model: 'Prazo relativo', label: `${validity.amount ?? 0} ${unit} após a emissão`, note: cap }
}

function conditionText(condition: ApiCondition) {
  if (condition.type === 'PurchaseTotal') return `Compra mínima de ${moneyOrNone(condition.minAmount)}`
  if (condition.type === 'ItemQuantity') return `Quantidade mínima de ${condition.minQuantity ?? 0}`
  if (condition.type === 'Category') return 'Categoria específica'
  if (condition.type === 'Product') return 'Produto específico'
  return condition.type
}

function detailSections(campaign: ApiCampaignDetail): CampaignInfoSection[] {
  const first = campaign.detailItems[0]
  const application = !first || first.targetType === 'All'
    ? 'Valor total da compra'
    : first.targetType === 'Category' ? 'Categorias específicas' : 'Produtos específicos'
  const audience = campaign.audienceType === 'AllCustomers'
    ? 'Todos os clientes'
    : campaign.audienceType === 'Restricted' ? 'Público restrito' : 'Não definido'
  const perCustomer = campaign.perCustomerVoucherLimit === null ? 'sem limite por cliente' : `${campaign.perCustomerVoucherLimit} por cliente`

  return [
    {
      title: 'Alvos e benefícios',
      items: [
        { label: 'Aplicação do desconto', value: application },
        { label: 'Quantidade máxima / por cliente', value: `${campaign.totalVoucherLimit ?? 0} vouchers / ${perCustomer}` },
        { label: 'Benefício', value: formatBenefit(first) || 'Não informado' },
      ],
    },
    {
      title: 'Regras e público',
      items: [
        { label: 'Público elegível', value: audience },
        { label: 'Condição de geração', value: campaign.conditions.map(conditionText).join(' e ') || 'Nenhuma condição' },
        { label: 'Restrição de uso', value: `Compra de ${moneyOrNone(campaign.minPurchaseAmount)} a ${moneyOrNone(campaign.maxPurchaseAmount)} · ${campaign.maxUsesPerVoucher ?? 1} uso(s) por voucher` },
      ],
    },
    {
      title: 'Escopo e canais',
      items: [
        { label: 'Escopo organizacional', value: 'Ainda não gravado' },
        { label: 'Canais habilitados', value: 'A escolha fica só neste navegador' },
      ],
    },
  ]
}

export function toCampaignDetails(value: unknown): CampaignDetails {
  const campaign = readDetail(value)
  return {
    id: campaign.id,
    category: 'Campanha',
    status: mapStatus(campaign.status),
    name: campaign.name,
    description: campaign.description ?? '',
    benefitLabel: formatBenefit(campaign.detailItems[0]) || undefined,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    referenceAt: campaign.startsAt,
    voucherValidity: validityText(campaign.voucherValidity),
    metrics: { issued: 0, used: 0, expired: 0, issueLimit: campaign.totalVoucherLimit },
    lastUsedVoucher: null,
    recentVouchers: [],
    info: detailSections(campaign),
    rejectionReason: campaign.rejectionReason ?? undefined,
  }
}

const genericDecisionMessage = 'Não foi possível atualizar o status da campanha. Tente novamente.'

function decisionError(error: unknown): Error {
  if (!axios.isAxiosError(error)) return new Error(genericDecisionMessage)
  const message = problemMessage(error.response?.data)
  return new Error(message === genericSaveMessage ? genericDecisionMessage : message)
}

export async function decideCampaign(id: string, action: 'submit' | 'approve' | 'reject', reason?: string): Promise<CampaignDetails> {
  try {
    const body = action === 'reject' ? { reason: reason?.trim() ? reason.trim() : null } : undefined
    const { data } = await api.post<unknown>(`/api/v1/campaigns/${id}/${action}`, body)
    return toCampaignDetails(data)
  } catch (error) {
    throw decisionError(error)
  }
}

export async function fetchCampaignDetails(id: string): Promise<CampaignDetails | null> {
  try {
    const { data } = await api.get<unknown>(`/api/v1/campaigns/${id}`)
    return toCampaignDetails(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
