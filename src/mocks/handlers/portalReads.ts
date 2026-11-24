import { http, HttpResponse } from 'msw'

const networkId = '0199e3a0-0000-7000-8000-000000000001'
const voucherId = '0199e3a0-aaaa-7000-8000-000000000101'
const campaignId = '0199e3a0-aaaa-7000-8000-000000000201'
const auditId = '0199e3a0-aaaa-7000-8000-000000000301'

const voucher = {
  id: voucherId,
  code: 'VCH-8F2A91',
  campaignId,
  campaignName: 'Campanha demonstrativa',
  customerName: null,
  customerDocumentMasked: '***.456.789-**',
  issuedAt: '2026-10-10T12:00:00-03:00',
  validUntil: '2026-11-09T23:59:59-03:00',
  usesCount: 0,
  maxUses: 1,
  status: 'Available',
}

export const portalReadHandlers = [
  http.get('*/api/v1/vouchers/:id', ({ params }) => {
    if (params.id !== voucherId) {
      return HttpResponse.json({ title: 'Não encontrado', detail: 'Voucher não encontrado.', code: 'NOT_FOUND' }, { status: 404 })
    }
    return HttpResponse.json({
      voucher,
      benefit: '10%',
      scope: [
        { label: 'Loja', value: 'Loja demonstrativa' },
        { label: 'Canal', value: 'Físico' },
      ],
      events: [
        {
          id: '0199e3a0-aaaa-7000-8000-000000000401',
          type: 'Confirmed',
          occurredAt: '2026-10-10T12:01:00-03:00',
          origin: 'Aplicação satélite',
          place: 'Loja demonstrativa · Físico',
          result: 'Venda confirmada',
        },
      ],
    })
  }),

  http.get('*/api/v1/vouchers', ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('networkId') !== networkId) {
      return HttpResponse.json({ title: 'Escopo', detail: 'Fora do escopo', code: 'SCOPE_FORBIDDEN' }, { status: 403 })
    }
    const requestedCampaign = url.searchParams.get('campaignId')
    if (requestedCampaign && requestedCampaign !== voucher.campaignId) {
      return HttpResponse.json([])
    }
    return HttpResponse.json([voucher])
  }),

  http.get('/api/v1/reports/catalog', () => HttpResponse.json({
    campaigns: [{ value: campaignId, label: 'Campanha demonstrativa' }],
    regions: [{ value: '0199e3a0-aaaa-7000-8000-000000000501', label: 'Região Norte' }],
    establishments: [{
      value: '0199e3a0-aaaa-7000-8000-000000000601',
      label: 'Loja Centro',
      regionId: '0199e3a0-aaaa-7000-8000-000000000501',
    }],
  })),

  http.get('/api/v1/reports/overview', () => HttpResponse.json({
    kpis: { issued: 1, redeemed: 0, expired: 0, available: 1, cancelled: 0, utilizationRate: 0 },
    monthly: [{ month: 'out/26', issued: 1, redeemed: 0, expired: 0 }],
    statusDistribution: [{ status: 'available', count: 1 }],
    topCampaigns: [{ campaignId, name: 'Campanha demonstrativa', issued: 1, redeemed: 0, rate: 0 }],
    regions: [{
      regionId: '0199e3a0-aaaa-7000-8000-000000000501',
      name: 'Região Norte',
      vouchers: 1,
      rate: 0,
      averageTicket: null,
    }],
  })),

  http.get('/api/v1/audit-entries', () => HttpResponse.json([{
    id: auditId,
    eventType: 'CampaignSubmitted',
    actorType: 'User',
    actorId: '0199e3a0-aaaa-7000-8000-000000000701',
    campaignId,
    campaignName: 'Campanha demonstrativa',
    entityType: 'Campaign',
    entityId: campaignId,
    occurredAt: '2026-10-10T12:00:00-03:00',
    payload: '{"status":"PendingApproval"}',
  }])),

  http.get('/api/v1/audit-entries/:id', ({ params }) => {
    if (params.id !== auditId) {
      return HttpResponse.json({ title: 'Não encontrado', detail: 'Registro de auditoria não encontrado.', code: 'NOT_FOUND' }, { status: 404 })
    }
    return HttpResponse.json({
      id: auditId,
      eventType: 'CampaignSubmitted',
      actorType: 'User',
      actorId: '0199e3a0-aaaa-7000-8000-000000000701',
      networkId,
      campaignId,
      campaignName: 'Campanha demonstrativa',
      entityType: 'Campaign',
      entityId: campaignId,
      occurredAt: '2026-10-10T12:00:00-03:00',
      payload: '{"status":"PendingApproval"}',
    })
  }),
]
