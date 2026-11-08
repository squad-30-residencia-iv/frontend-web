import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { initialCampaignDraft, readSavedCampaignId } from '../data/campaignDraft'
import { server } from '../mocks/server'
import { api } from './api'
import {
  campaignPersistBlocker,
  fetchNetworkCampaigns,
  formatBenefit,
  saveCampaignDraft,
  toHomeOverview,
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
