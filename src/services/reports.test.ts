import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../mocks/server'
import { defaultReportFilters } from '../data/reportFilters'
import { fetchReportCatalogFromApi, fetchReportFromApi } from './reports'

const network = '0199e3a0-0000-7000-8000-000000000001'
const campaign = '0199e3a0-aaaa-7000-8000-000000000201'

describe('Contrato HTTP de Relatórios', () => {
  it('normaliza catálogo incompleto sem inventar opções e declara filtros suportados', async () => {
    server.use(http.get('*/api/v1/reports/catalog', () => HttpResponse.json({ campaigns: null })))
    const result = await fetchReportCatalogFromApi(network)
    expect(result.campaigns).toEqual([])
    expect(result.regions).toEqual([])
    expect(result.establishments).toEqual([])
    expect(result.supportedFilters).toEqual(['period', 'campaign', 'region', 'establishment'])
  })
  it('não envia ids vazios, all, inválidos ou filtros sem suporte', async () => {
    let search = ''
    server.use(http.get('*/api/v1/reports/overview', ({ request }) => {
      search = new URL(request.url).search
      return HttpResponse.json({})
    }))
    await fetchReportFromApi(network, { ...defaultReportFilters, campaign, region: '', establishment: 'invalid', customerType: 'vip' })
    const params = new URLSearchParams(search)
    expect(Object.fromEntries(params)).toEqual({ networkId: network, period: '30d', campaignId: campaign })
  })
  it('converte campos ausentes em zero e listas ausentes em vazias', async () => {
    server.use(http.get('*/api/v1/reports/overview', () => HttpResponse.json({ kpis: { issued: 2 }, monthly: null })))
    const data = await fetchReportFromApi(network, defaultReportFilters)
    expect(data.kpis.issued).toBe(2)
    expect(data.kpis.available).toBe(0)
    expect(data.monthly).toEqual([])
    expect(data.statusDistribution).toHaveLength(4)
    expect(data.topCampaigns).toEqual([])
  })
  it('recusa formato malformado em vez de mascarar erro como sucesso vazio', async () => {
    server.use(http.get('*/api/v1/reports/overview', () => HttpResponse.json({ kpis: { issued: 'oops' } })))
    await expect(fetchReportFromApi(network, defaultReportFilters)).rejects.toThrow(/formato.*inválido/)
  })
  it('preserva ProblemDetails e recusa sessão com rede inválida', async () => {
    server.use(http.get('*/api/v1/reports/overview', () => HttpResponse.json({ detail: 'Fora do escopo da rede.' }, { status: 403 })))
    await expect(fetchReportFromApi(network, defaultReportFilters)).rejects.toThrow('Fora do escopo da rede.')
    await expect(fetchReportCatalogFromApi('')).rejects.toThrow(/rede válida/)
  })
})
