import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { initialCampaignDraft, readSavedCampaignId } from '../data/campaignDraft'
import { server } from '../mocks/server'
import { api } from './api'
import {
  campaignPersistBlocker,
  campaignToDraft,
  duplicateCampaign,
  fetchNetworkCampaigns,
  formatBenefit,
  saveCampaignDraft,
  scopeBody,
  scopeSummary,
  toHomeOverview,
  toListCampaign,
  type ApiCampaign,
} from './campaigns'

const campaign: ApiCampaign = {
  id: '0199e3a0-0000-7000-8000-000000000111',
  name: 'Volta às Aulas',
  description: 'Campanha da rede',
  startsAt: '2026-10-01T08:00:00-03:00',
  endsAt: '2026-10-31T23:59:00-03:00',
  status: 'Active',
  totalVoucherLimit: 100,
  items: [{ benefitType: 'Percentage', benefitValue: 10, categoryId: null }],
}

const networkScope = { mode: 'network' as const, networkChannels: ['physical' as const], storeIds: [], storeChannels: [] }

describe('campanhas da rede', () => {
  it('traduz status, limite, escopo e o benefício do primeiro item', () => {
    const overview = toHomeOverview([campaign])

    expect(overview.campaigns[0]).toMatchObject({
      name: 'Volta às Aulas',
      start: '2026-10-01',
      end: '2026-10-31',
      status: 'active',
      vouchers: 100,
      usage: 0,
      benefit: '10% OFF',
    })
    expect(overview.featured?.title).toBe('Volta às Aulas')
    expect(formatBenefit({ benefitType: 'FixedAmount', benefitValue: 20, categoryId: null })).toBe('R$ 20 OFF')
  })

  it('lista vazia não tem destaque', () => {
    expect(toHomeOverview([])).toEqual({ featured: null, categories: [], campaigns: [] })
  })

  it('administrador não chama a API', async () => {
    const get = vi.spyOn(api, 'get')
    await expect(fetchNetworkCampaigns(null)).resolves.toEqual([])
    expect(get).not.toHaveBeenCalled()
    get.mockRestore()
  })

  it('analista recebe as campanhas do GET', async () => {
    const items = await fetchNetworkCampaigns('0199e3a0-0000-7000-8000-000000000001')
    expect(items[0]?.name).toBe('Volta às Aulas')
    expect(items[0]?.items[0]?.benefitValue).toBe(10)
  })

  it('não envia benefício extra nem condição em qualquer', () => {
    const extra = {
      ...initialCampaignDraft,
      benefits: { ...initialCampaignDraft.benefits, addedBenefits: [{ type: 'percentage' as const, value: '5' }] },
    }
    const anyMatch = {
      ...initialCampaignDraft,
      rules: { ...initialCampaignDraft.rules, conditionMatch: 'any' as const },
    }
    expect(campaignPersistBlocker(extra)).toMatch(/um benefício por alvo/)
    expect(campaignPersistBlocker(anyMatch)).toMatch(/valem juntas/)
  })

  it('cria uma vez e reaproveita o id se um PUT falhar', async () => {
    const posts: string[] = []
    const onRequest = ({ request }: { request: Request }) => {
      if (request.method === 'POST' && request.url.includes('/api/v1/campaigns')) posts.push(request.url)
    }
    server.events.on('request:start', onRequest)
    let failItems = true
    server.use(http.put('*/api/v1/campaigns/:id/items', () => {
      if (failItems) {
        failItems = false
        return HttpResponse.json({ detail: 'Falha ao gravar os itens.' }, { status: 422 })
      }
      return HttpResponse.json({ id: 'ok' })
    }))
    const draft = {
      ...initialCampaignDraft,
      information: { ...initialCampaignDraft.information, name: 'Campanha da API' },
      scope: networkScope,
    }

    await expect(saveCampaignDraft('0199e3a0-0000-7000-8000-000000000001', draft, null)).rejects.toThrow('Falha ao gravar os itens.')
    const id = readSavedCampaignId()
    expect(posts).toHaveLength(1)
    expect(id).toBeTruthy()
    await expect(saveCampaignDraft('0199e3a0-0000-7000-8000-000000000001', draft, id)).resolves.toMatchObject({ id })
    expect(posts).toHaveLength(1)
    server.events.removeListener('request:start', onRequest)
  })
})

describe('escopo e edição do rascunho (US-021)', () => {
  const stores = [
    { id: 'loja-centro', code: '001', name: 'Loja Centro', channels: ['physical' as const] },
    { id: 'loja-online', code: '003', name: 'Loja Online', channels: ['virtual' as const] },
    { id: 'loja-mista', code: '004', name: 'Loja Mista', channels: ['physical' as const, 'virtual' as const] },
  ]

  it('envia a rede com os canais dela', () => {
    expect(scopeBody({ mode: 'network', networkChannels: ['physical', 'virtual'], storeIds: ['loja-centro'], storeChannels: [] }))
      .toEqual([{ regionId: null, establishmentId: null, channels: ['Physical', 'Virtual'] }])
  })

  it('envia cada loja só com os canais escolhidos que ela opera', () => {
    const body = scopeBody(
      { mode: 'stores', networkChannels: [], storeIds: ['loja-centro', 'loja-online', 'loja-mista'], storeChannels: ['physical'] },
      stores,
    )

    expect(body).toEqual([
      { regionId: null, establishmentId: 'loja-centro', channels: ['Physical'] },
      { regionId: null, establishmentId: 'loja-mista', channels: ['Physical'] },
    ])
  })

  it('resume o escopo gravado na listagem', () => {
    const store = { regionId: null, establishmentId: 'loja-centro', name: 'Loja Centro', code: '001', channels: ['Physical'] }
    const region = { regionId: 'r1', establishmentId: null, name: 'Região Norte', code: null, channels: ['Virtual'] }

    expect(scopeSummary(undefined)).toBe('Não definido')
    expect(scopeSummary([{ ...store, establishmentId: null, name: null, code: null }])).toBe('Rede')
    expect(scopeSummary([store])).toBe('001 — Loja Centro')
    expect(scopeSummary([store, region])).toBe('2 locais')
    expect(toListCampaign({ ...campaign, scopes: [region] }).scope).toBe('Região Norte')
  })

  it('grava nome e vigência e o escopo ao salvar uma campanha que já existe', async () => {
    const requests: string[] = []
    const onRequest = ({ request }: { request: Request }) => { requests.push(`${request.method} ${new URL(request.url).pathname}`) }
    server.events.on('request:start', onRequest)
    const id = '0199e3a0-0000-7000-8000-000000000111'
    const draft = { ...initialCampaignDraft, scope: networkScope }

    await saveCampaignDraft('0199e3a0-0000-7000-8000-000000000001', draft, id, { description: 'Campanha da rede' })

    server.events.removeListener('request:start', onRequest)
    expect(requests).toContain(`PUT /api/v1/campaigns/${id}`)
    expect(requests).toContain(`PUT /api/v1/campaigns/${id}/scopes`)
    expect(requests.some(request => request.startsWith('POST'))).toBe(false)
  })

  it('reabre a campanha no formato do assistente e avisa o que a tela não mostra', () => {
    const { draft, notices } = campaignToDraft({
      ...campaign,
      status: 'Draft',
      totalVoucherLimit: 500,
      perCustomerVoucherLimit: 2,
      audienceType: 'AllCustomers',
      voucherValidity: { type: 'FixedDate', amount: null, unit: null, validUntil: '2026-12-31T23:59:00-03:00', cap: null },
      minPurchaseAmount: 50,
      maxPurchaseAmount: 1500.5,
      conditions: [
        { type: 'PurchaseTotal', minAmount: 200, minQuantity: null, categoryId: null, productId: null },
        { type: 'Category', minAmount: null, minQuantity: null, categoryId: 'c1', productId: null },
      ],
      items: [
        { targetType: 'Category', categoryId: 'c1', productId: null, benefitType: 'FixedAmount', benefitValue: 20 },
        { targetType: 'Category', categoryId: 'c2', productId: null, benefitType: 'FixedAmount', benefitValue: 20 },
      ],
      scopes: [
        { regionId: null, establishmentId: 'loja-centro', name: 'Loja Centro', code: '001', channels: ['Physical'] },
        { regionId: null, establishmentId: 'loja-online', name: 'Loja Online', code: '003', channels: ['Virtual'] },
        { regionId: 'r1', establishmentId: null, name: 'Região Norte', code: null, channels: ['Physical'] },
      ],
    })

    expect(draft.information).toMatchObject({ name: 'Volta às Aulas', start: '2026-10-01T08:00', end: '2026-10-31T23:59', voucherDurationDays: '' })
    expect(draft.benefits).toMatchObject({
      discountType: 'fixed', fixedAmount: '20,00', application: 'specific', targetType: 'category',
      targetIds: ['c1', 'c2'], maxVouchers: '500', limitPerCustomer: '2',
    })
    expect(draft.rules.conditions).toEqual([{ id: 'condition-1', type: 'purchase-total', operator: 'gte', value: '200,00' }])
    expect(draft.rules.restrictions).toEqual([{ id: 'restriction-1', type: 'purchase-value', minimum: '50,00', maximum: '1500,50' }])
    expect(draft.scope).toEqual({ mode: 'stores', networkChannels: [], storeIds: ['loja-centro', 'loja-online'], storeChannels: ['physical', 'virtual'] })
    expect(notices.join(' ')).toMatch(/validade gravada/)
    expect(notices.join(' ')).toMatch(/Condições de categoria/)
    expect(notices.join(' ')).toMatch(/Regiões gravadas/)
  })

  it('duplica e devolve o id da cópia; o 422 mostra o detail', async () => {
    const id = await duplicateCampaign('0199e3a0-0000-7000-8000-000000000111', {
      name: 'Volta às Aulas 2', startsAt: '2026-12-01T08:00', endsAt: '2026-12-24T23:59',
    })
    expect(id).toMatch(/^0199e3a0-0000-7000-8000-0000000003/)

    server.use(http.post('*/api/v1/campaigns/:id/duplicate', () =>
      HttpResponse.json({ status: 422, detail: 'O início não pode ser anterior ao minuto atual.', code: 'CAMPAIGN_START_IN_PAST' }, { status: 422 })))
    await expect(duplicateCampaign(id, { name: '', startsAt: '2026-01-01T08:00', endsAt: '2026-01-02T08:00' }))
      .rejects.toThrow('O início não pode ser anterior ao minuto atual.')
  })
})
