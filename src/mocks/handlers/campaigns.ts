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

export const campaignHandlers = [
  http.get('*/api/v1/campaigns', ({ request }) => {
    const networkId = new URL(request.url).searchParams.get('networkId')
    if (!networkId) {
      return HttpResponse.json(
        { status: 400, detail: 'A rede é obrigatória.', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }

    return HttpResponse.json(networkCampaigns.map(campaign => ({
      ...campaign,
      networkId,
      timeZone: 'America/Sao_Paulo',
      perCustomerVoucherLimit: null,
      undistributedVouchers: 100,
      issuedVouchers: 0,
      createdAt: '2026-09-01T12:00:00Z',
      audienceType: null,
      voucherValidity: null,
      minPurchaseAmount: null,
      maxPurchaseAmount: null,
      maxUsesPerVoucher: null,
      conditions: [],
      allowUseInSamePurchase: false,
      items: campaign.items.map((item, index) => ({
        id: `${campaign.id}-${index}`,
        targetType: 'All',
        productId: null,
        voucherLimit: null,
        ...item,
      })),
    })))
  }),
]
