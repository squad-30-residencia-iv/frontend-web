import { http, HttpResponse } from 'msw'
import type { ApiCampaign } from '../../services/campaigns'

export const networkCampaigns: ApiCampaign[] = [
  {
    id: '0199e3a0-0000-7000-8000-000000000111',
    name: 'Volta às Aulas',
    description: 'Campanha da rede',
    startsAt: '2026-10-01T08:00:00-03:00',
    endsAt: '2026-10-31T23:59:00-03:00',
    status: 'Draft',
    totalVoucherLimit: 100,
    items: [
      { benefitType: 'Percentage', benefitValue: 10, categoryId: null },
    ],
  },
]

interface StoredCampaign extends ApiCampaign {
  networkId: string
  perCustomerVoucherLimit: number | null
  audienceType: string | null
  minPurchaseAmount: number | null
  maxPurchaseAmount: number | null
  maxUsesPerVoucher: number | null
}

const createdCampaigns: StoredCampaign[] = []
let createdSequence = 1

export function resetCreatedCampaigns() {
  createdCampaigns.length = 0
  createdSequence = 1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toResponse(campaign: ApiCampaign, networkId: string, extra: Partial<StoredCampaign> = {}) {
  return {
    ...campaign,
    networkId,
    timeZone: 'America/Sao_Paulo',
    perCustomerVoucherLimit: extra.perCustomerVoucherLimit ?? null,
    undistributedVouchers: campaign.totalVoucherLimit,
    issuedVouchers: 0,
    createdAt: '2026-09-01T12:00:00Z',
    audienceType: extra.audienceType ?? 'AllCustomers',
    voucherValidity: { type: 'Relative', amount: 30, unit: 'Days', cap: null, validUntil: null },
    minPurchaseAmount: extra.minPurchaseAmount ?? 100,
    maxPurchaseAmount: extra.maxPurchaseAmount ?? null,
    maxUsesPerVoucher: extra.maxUsesPerVoucher ?? 1,
    conditions: [{ id: `${campaign.id}-condition`, type: 'PurchaseTotal', minAmount: 200, minQuantity: null, categoryId: null, productId: null }],
    allowUseInSamePurchase: false,
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

export const campaignHandlers = [
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
      perCustomerVoucherLimit: null,
      audienceType: null,
      minPurchaseAmount: null,
      maxPurchaseAmount: null,
      maxUsesPerVoucher: null,
      items: [],
    }
    createdCampaigns.push(campaign)
    return HttpResponse.json(toResponse(campaign, campaign.networkId, campaign), { status: 201 })
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
  http.get('*/api/v1/categories', () => HttpResponse.json([
    { id: '0199e3a0-0000-7000-8000-000000000301', name: 'Papelaria', isActive: true, createdAt: '2026-09-01T12:00:00Z' },
  ])),
  http.get('*/api/v1/products', () => HttpResponse.json([
    { id: '0199e3a0-0000-7000-8000-000000000302', categoryId: '0199e3a0-0000-7000-8000-000000000301', code: 'CAD-1', name: 'Caderno', isActive: true, createdAt: '2026-09-01T12:00:00Z' },
  ])),
  http.get('*/api/v1/regions', ({ request }) => {
    const networkId = new URL(request.url).searchParams.get('networkId')
    if (!networkId) {
      return HttpResponse.json({ status: 400, detail: 'Informe a rede.', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    return HttpResponse.json([
      { id: '0199e3a0-0000-7000-8000-000000000311', networkId, name: 'Sudeste', isActive: true, createdAt: '2026-09-01T12:00:00Z' },
    ])
  }),
  http.get('*/api/v1/establishments', ({ request }) => {
    const regionId = new URL(request.url).searchParams.get('regionId')
    if (!regionId) {
      return HttpResponse.json({ status: 400, detail: 'Informe a região do estabelecimento.', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    return HttpResponse.json([
      { id: '0199e3a0-0000-7000-8000-000000000321', regionId, code: '001', name: 'Loja Centro', channels: ['Physical'], isActive: true, createdAt: '2026-09-01T12:00:00Z' },
    ])
  }),
]
