import { http, HttpResponse } from 'msw'
import type { ApiCampaign, ApiCampaignScope } from '../../services/campaigns'
import { parseMockJwt } from '../jwtUtils'

interface MockCampaign extends ApiCampaign {
  networkId?: string
}

export const networkCampaigns: MockCampaign[] = [
  {
    id: '0199e3a0-0000-7000-8000-000000000111',
    name: 'Volta às Aulas',
    description: 'Campanha da rede',
    startsAt: '2026-10-01T08:00:00-03:00',
    endsAt: '2026-10-31T23:59:00-03:00',
    status: 'Draft',
    totalVoucherLimit: 100,
    issuedVouchers: 0,
    reservedVouchers: 0,
    items: [
      { benefitType: 'Percentage', benefitValue: 10, categoryId: null },
    ],
  },
]

interface StoredCampaign extends MockCampaign {
  networkId: string
  perCustomerVoucherLimit: number | null
  audienceType: string | null
  minPurchaseAmount: number | null
  maxPurchaseAmount: number | null
  maxUsesPerVoucher: number | null
  scopes: ApiCampaignScope[]
}

/** Lojas que o mock de establishments devolve, com os canais, para conferir o escopo (PR-11). */
const mockStores: Record<string, { code: string; name: string; channels: string[] }> = {
  '0199e3a0-0000-7000-8000-000000000321': { code: '001', name: 'Loja Centro', channels: ['Physical'] },
}

const createdCampaigns: StoredCampaign[] = []
let createdSequence = 1

const seedCampaign = networkCampaigns[0]
const seedSnapshot = {
  name: seedCampaign.name,
  description: seedCampaign.description,
  status: seedCampaign.status,
  startsAt: seedCampaign.startsAt,
  endsAt: seedCampaign.endsAt,
}

export function resetCreatedCampaigns() {
  createdCampaigns.length = 0
  createdSequence = 1
  seedCampaign.name = seedSnapshot.name
  seedCampaign.description = seedSnapshot.description
  seedCampaign.status = seedSnapshot.status
  seedCampaign.startsAt = seedSnapshot.startsAt
  seedCampaign.endsAt = seedSnapshot.endsAt
  seedCampaign.rejectionReason = null
  seedCampaign.scopes = []
  seedCampaign.issuedVouchers = 0
  seedCampaign.reservedVouchers = 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Espelha Campaign.EffectiveStatus/BusinessTime da API local; não é usado nas telas. */
function effectiveStatus(campaign: MockCampaign) {
  if (!['Scheduled', 'Active', 'Paused'].includes(campaign.status)) return campaign.status
  const now = Date.now()
  const afterEndMinute = Math.floor(Date.parse(campaign.endsAt) / 60000) * 60000 + 60000
  if (now >= afterEndMinute) return 'Ended'
  if (campaign.status === 'Paused') return 'Paused'
  if (now < Date.parse(campaign.startsAt)) return 'Scheduled'
  const consumed = (campaign.issuedVouchers ?? 0) + (campaign.reservedVouchers ?? 0)
  return campaign.totalVoucherLimit !== null && consumed >= campaign.totalVoucherLimit ? 'SoldOut' : 'Active'
}

function toResponse(campaign: MockCampaign, networkId: string, extra: Partial<StoredCampaign> = {}) {
  return {
    ...campaign,
    status: effectiveStatus(campaign),
    networkId,
    timeZone: 'America/Sao_Paulo',
    perCustomerVoucherLimit: extra.perCustomerVoucherLimit ?? null,
    undistributedVouchers: campaign.totalVoucherLimit,
    issuedVouchers: campaign.issuedVouchers ?? 0,
    reservedVouchers: campaign.reservedVouchers ?? 0,
    createdAt: '2026-09-01T12:00:00Z',
    audienceType: extra.audienceType ?? 'AllCustomers',
    voucherValidity: { type: 'Relative', amount: 30, unit: 'Days', cap: null, validUntil: null },
    minPurchaseAmount: extra.minPurchaseAmount ?? 100,
    maxPurchaseAmount: extra.maxPurchaseAmount ?? null,
    maxUsesPerVoucher: extra.maxUsesPerVoucher ?? 1,
    conditions: [{ id: `${campaign.id}-condition`, type: 'PurchaseTotal', minAmount: 200, minQuantity: null, categoryId: null, productId: null }],
    allowUseInSamePurchase: false,
    rejectionReason: campaign.rejectionReason ?? null,
    scopes: extra.scopes ?? campaign.scopes ?? [],
    items: campaign.items.map((item, index) => ({
      id: `${campaign.id}-${index}`,
      targetType: 'All',
      productId: null,
      voucherLimit: null,
      ...item,
    })),
  }
}

function findCampaign(id: string) {
  return createdCampaigns.find(campaign => campaign.id === id)
    ?? networkCampaigns.find(campaign => campaign.id === id)
    ?? null
}

function problem(status: number, detail: string, code: string) {
  return HttpResponse.json({ status, detail, code }, { status })
}

function decide(id: string, action: 'submit' | 'approve' | 'reject', reason: string | null = null) {
  const campaign = findCampaign(id)
  if (!campaign) return problem(404, 'Campanha não encontrada.', 'NOT_FOUND')
  if (action === 'submit') {
    if (campaign.status !== 'Draft') return problem(422, 'Somente um rascunho pode ser submetido para aprovação.', 'CAMPAIGN_SUBMIT_NOT_DRAFT')
    campaign.status = 'PendingApproval'
    campaign.rejectionReason = null
  } else if (campaign.status !== 'PendingApproval') {
    return problem(422, 'Somente uma campanha em aprovação pode ser aprovada ou reprovada.', 'CAMPAIGN_DECISION_NOT_PENDING')
  } else if (action === 'reject') {
    campaign.status = 'Rejected'
    campaign.rejectionReason = reason
  } else {
    const now = Date.now()
    const end = Date.parse(campaign.endsAt)
    const start = Date.parse(campaign.startsAt)
    if (Number.isFinite(end) && now >= end) return problem(422, 'A vigência da campanha já terminou.', 'CAMPAIGN_APPROVE_PERIOD_ENDED')
    campaign.status = now < start ? 'Scheduled' : 'Active'
    campaign.rejectionReason = null
  }
  const stored = createdCampaigns.find(item => item.id === campaign.id)
  return HttpResponse.json(toResponse(campaign, stored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001', stored))
}

export const campaignHandlers = [
  ...(['pause', 'end'] as const).map(action => http.post(`*/api/v1/campaigns/:id/${action}`, ({ params, request }) => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
    const actor = parseMockJwt(token)
    if (!actor || actor.exp <= Date.now() / 1000) return problem(401, 'Autenticação necessária.', 'AUTH_UNAUTHENTICATED')
    if (actor.role !== 'analista' && actor.role !== 'gestor') return problem(403, 'Seu papel não permite esta operação.', 'AUTH_FORBIDDEN_ROLE')
    const campaign = findCampaign(String(params.id))
    if (!campaign) return problem(404, 'Campanha não encontrada.', 'NOT_FOUND')
    const stored = createdCampaigns.find(item => item.id === campaign.id)
    const networkId = stored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001'
    if (actor.networkId !== networkId) return problem(403, 'Escopo organizacional fora da sua permissão de acesso', 'SCOPE_FORBIDDEN')
    const allowed = action === 'pause' ? ['Active'] : ['Active', 'Paused']
    if (!allowed.includes(effectiveStatus(campaign))) {
      return action === 'pause'
        ? problem(422, 'Somente uma campanha ativa pode ser pausada.', 'CAMPAIGN_PAUSE_NOT_ACTIVE')
        : problem(422, 'Somente uma campanha ativa ou pausada pode ser encerrada.', 'CAMPAIGN_END_NOT_ALLOWED')
    }
    campaign.status = action === 'pause' ? 'Paused' : 'Ended'
    return HttpResponse.json(toResponse(campaign, stored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001', stored))
  })),
  http.get('*/api/v1/campaigns/:id', ({ params }) => {
    const campaign = findCampaign(String(params.id))
    if (!campaign) {
      return HttpResponse.json({ status: 404, detail: 'Campanha não encontrada.', code: 'NOT_FOUND' }, { status: 404 })
    }
    const stored = createdCampaigns.find(item => item.id === campaign.id)
    return HttpResponse.json(toResponse(campaign, stored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001', stored))
  }),
  http.get('*/api/v1/campaigns', ({ request }) => {
    const networkId = new URL(request.url).searchParams.get('networkId')
    if (!networkId) {
      return HttpResponse.json(
        { status: 400, detail: 'A rede é obrigatória.', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }

    const visible = [
      ...networkCampaigns,
      ...createdCampaigns.filter(campaign => campaign.networkId === networkId),
    ]
    return HttpResponse.json(visible.map(campaign => toResponse(campaign, networkId, campaign)))
  }),
  http.post('*/api/v1/campaigns', async ({ request }) => {
    const body: unknown = await request.json()
    if (!isRecord(body) || typeof body.networkId !== 'string' || typeof body.name !== 'string' || typeof body.startsAt !== 'string' || typeof body.endsAt !== 'string') {
      return HttpResponse.json({ status: 400, detail: 'Dados inválidos.', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    const id = `0199e3a0-0000-7000-8000-0000000002${String(createdSequence).padStart(2, '0')}`
    createdSequence += 1
    const campaign: StoredCampaign = {
      id,
      networkId: body.networkId,
      name: body.name,
      description: typeof body.description === 'string' ? body.description : null,
      startsAt: `${body.startsAt}:00-03:00`,
      endsAt: `${body.endsAt}:00-03:00`,
      status: 'Draft',
      totalVoucherLimit: null,
      issuedVouchers: 0,
      reservedVouchers: 0,
      perCustomerVoucherLimit: null,
      audienceType: null,
      minPurchaseAmount: null,
      maxPurchaseAmount: null,
      maxUsesPerVoucher: null,
      items: [],
      scopes: [],
    }
    createdCampaigns.push(campaign)
    return HttpResponse.json(toResponse(campaign, campaign.networkId, campaign), { status: 201 })
  }),
  http.put('*/api/v1/campaigns/:id', async ({ params, request }) => {
    const campaign = findCampaign(String(params.id))
    if (!campaign) return problem(404, 'Campanha não encontrada.', 'NOT_FOUND')
    if (campaign.status !== 'Draft') return problem(422, 'A campanha não está em rascunho.', 'CAMPAIGN_NOT_DRAFT')
    const body: unknown = await request.json()
    if (!isRecord(body) || typeof body.name !== 'string' || typeof body.startsAt !== 'string' || typeof body.endsAt !== 'string') {
      return problem(400, 'Dados inválidos.', 'VALIDATION_ERROR')
    }
    campaign.name = body.name
    campaign.description = typeof body.description === 'string' ? body.description : null
    campaign.startsAt = `${body.startsAt}:00-03:00`
    campaign.endsAt = `${body.endsAt}:00-03:00`
    const stored = createdCampaigns.find(item => item.id === campaign.id)
    return HttpResponse.json(toResponse(campaign, stored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001', stored))
  }),
  http.put('*/api/v1/campaigns/:id/scopes', async ({ params, request }) => {
    const campaign = findCampaign(String(params.id))
    if (!campaign) return problem(404, 'Campanha não encontrada.', 'NOT_FOUND')
    const body: unknown = await request.json()
    if (!isRecord(body) || !Array.isArray(body.scopes) || body.scopes.length === 0) {
      return problem(400, 'Informe ao menos um local do escopo.', 'VALIDATION_ERROR')
    }
    const scopes: ApiCampaignScope[] = []
    for (const entry of body.scopes) {
      if (!isRecord(entry) || !Array.isArray(entry.channels)) return problem(400, 'Dados inválidos.', 'VALIDATION_ERROR')
      const channels = entry.channels.filter((channel): channel is string => typeof channel === 'string')
      const storeId = typeof entry.establishmentId === 'string' ? entry.establishmentId : null
      const store = storeId ? mockStores[storeId] : undefined
      if (storeId && !store) return problem(422, 'Loja informada não encontrada', 'CAMPAIGN_SCOPE_ESTABLISHMENT_NOT_FOUND')
      const missing = store ? channels.find(channel => !store.channels.includes(channel)) : undefined
      if (store && missing) {
        return problem(422, `A loja ${store.code} não opera o canal ${missing === 'Virtual' ? 'virtual' : 'físico'}.`, 'CAMPAIGN_SCOPE_CHANNEL_NOT_ENABLED')
      }
      scopes.push({ regionId: null, establishmentId: storeId, name: store?.name ?? null, code: store?.code ?? null, channels })
    }
    campaign.scopes = scopes
    const stored = createdCampaigns.find(item => item.id === campaign.id)
    if (stored) stored.scopes = scopes
    return HttpResponse.json(toResponse(campaign, stored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001', stored))
  }),
  http.post('*/api/v1/campaigns/:id/duplicate', async ({ params, request }) => {
    const source = findCampaign(String(params.id))
    if (!source) return problem(404, 'Campanha não encontrada.', 'NOT_FOUND')
    const body: unknown = await request.json().catch(() => null)
    const record = isRecord(body) ? body : {}
    const id = `0199e3a0-0000-7000-8000-0000000003${String(createdSequence).padStart(2, '0')}`
    createdSequence += 1
    const sourceStored = createdCampaigns.find(item => item.id === source.id)
    const copy: StoredCampaign = {
      ...source,
      id,
      networkId: sourceStored?.networkId ?? '0199e3a0-0000-7000-8000-000000000001',
      name: typeof record.name === 'string' && record.name.trim() ? record.name.trim() : `Cópia de ${source.name}`,
      startsAt: typeof record.startsAt === 'string' ? `${record.startsAt}:00-03:00` : source.startsAt,
      endsAt: typeof record.endsAt === 'string' ? `${record.endsAt}:00-03:00` : source.endsAt,
      status: 'Draft',
      rejectionReason: null,
      perCustomerVoucherLimit: sourceStored?.perCustomerVoucherLimit ?? null,
      audienceType: sourceStored?.audienceType ?? 'AllCustomers',
      minPurchaseAmount: sourceStored?.minPurchaseAmount ?? null,
      maxPurchaseAmount: sourceStored?.maxPurchaseAmount ?? null,
      maxUsesPerVoucher: sourceStored?.maxUsesPerVoucher ?? 1,
      items: source.items.map(item => ({ ...item })),
      scopes: (sourceStored?.scopes ?? source.scopes ?? []).map(scope => ({ ...scope })),
    }
    createdCampaigns.push(copy)
    return HttpResponse.json(toResponse(copy, copy.networkId, copy), { status: 201 })
  }),
  http.post('*/api/v1/campaigns/:id/submit', ({ params }) => decide(String(params.id), 'submit')),
  http.post('*/api/v1/campaigns/:id/approve', ({ params }) => decide(String(params.id), 'approve')),
  http.post('*/api/v1/campaigns/:id/reject', async ({ params, request }) => {
    const body: unknown = await request.json().catch(() => null)
    const reason = isRecord(body) && typeof body.reason === 'string' ? body.reason.trim() : ''
    return decide(String(params.id), 'reject', reason || null)
  }),
  http.put('*/api/v1/campaigns/:id/items', () => HttpResponse.json({ id: 'ok' })),
  http.put('*/api/v1/campaigns/:id/quantities', async ({ params, request }) => {
    const body: unknown = await request.json()
    const campaign = createdCampaigns.find(item => item.id === params.id)
    if (campaign && isRecord(body) && typeof body.totalVoucherLimit === 'number') {
      campaign.totalVoucherLimit = body.totalVoucherLimit
      campaign.perCustomerVoucherLimit = typeof body.perCustomerVoucherLimit === 'number' ? body.perCustomerVoucherLimit : null
    }
    return HttpResponse.json({ id: params.id })
  }),
  http.put('*/api/v1/campaigns/:id/audience', () => HttpResponse.json({ id: 'ok' })),
  http.put('*/api/v1/campaigns/:id/voucher-validity', () => HttpResponse.json({ id: 'ok' })),
  http.put('*/api/v1/campaigns/:id/usage-restrictions', () => HttpResponse.json({ id: 'ok' })),
  http.put('*/api/v1/campaigns/:id/conditions', () => HttpResponse.json({ id: 'ok' })),
]
