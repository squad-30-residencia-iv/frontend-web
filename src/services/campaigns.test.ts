import { describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { fetchNetworkCampaigns, formatBenefit, toHomeOverview, type ApiCampaign } from './campaigns'

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
})
