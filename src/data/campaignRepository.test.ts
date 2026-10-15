import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { campaignSchema, campaignBenefitsSchema, campaignInformationSchema } from '../schemas/campaignSchema'
import { initialCampaignDraft, campaignDraftStorageKey } from './campaignDraft'
import { activateCampaign, createdCampaignsStorageKey, loadCreatedCampaigns } from './campaignRepository'
import type { CampaignDraft } from '../types/campaign'

function validDraft(): CampaignDraft {
  return {
    ...structuredClone(initialCampaignDraft),
    information: { ...initialCampaignDraft.information, name: 'Campanha ativada' },
    scope: { ...initialCampaignDraft.scope, mode: 'network', networkChannels: ['physical'] },
  }
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Schemas de campanha', () => {
  it('rejeita datas iguais e aceita fim posterior', () => {
    const information = validDraft().information
    expect(campaignInformationSchema.safeParse({ ...information, end: information.start }).success).toBe(false)
    expect(campaignInformationSchema.safeParse(information).success).toBe(true)
  })

  it.each(['0', '0,5', '100,01'])('rejeita percentual fora dos limites: %s', percentage => {
    expect(campaignBenefitsSchema.safeParse({ ...validDraft().benefits, percentage }).success).toBe(false)
  })

  it.each(['1', '100'])('aceita o limite percentual %s', percentage => {
    expect(campaignBenefitsSchema.safeParse({ ...validDraft().benefits, percentage }).success).toBe(true)
  })

  it('rejeita estruturas inválidas e quantidades não positivas', () => {
    expect(campaignSchema.safeParse({ information: null }).success).toBe(false)
    expect(campaignBenefitsSchema.safeParse({ ...validDraft().benefits, maxVouchers: '0' }).success).toBe(false)
  })
})

describe('Repositório mockado', () => {
  it('persiste a ativação com configuração completa e limpa somente o rascunho', () => {
    const draft = validDraft()
    localStorage.setItem(campaignDraftStorageKey, JSON.stringify(draft))
    localStorage.setItem('outro-dado', 'preservar')
    activateCampaign(draft)
    expect(loadCreatedCampaigns()).toEqual([expect.objectContaining({ name: 'Campanha ativada', status: 'active', vouchers: 0 })])
    expect(JSON.parse(localStorage.getItem(createdCampaignsStorageKey)!)[0].draft).toEqual(draft)
    expect(localStorage.getItem(campaignDraftStorageKey)).toBeNull()
    expect(localStorage.getItem('outro-dado')).toBe('preservar')
    activateCampaign({ ...draft, information: { ...draft.information, name: 'Outra campanha' } })
    expect(loadCreatedCampaigns().map(campaign => campaign.name)).toEqual(['Outra campanha', 'Campanha ativada'])
  })

  it('restaura o rascunho quando a escrita da campanha falha', () => {
    const draft = validDraft()
    const serialized = JSON.stringify(draft)
    localStorage.setItem(campaignDraftStorageKey, serialized)
    const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === createdCampaignsStorageKey) throw new Error('Sem espaço')
      original.call(this, key, value)
    })
    expect(() => activateCampaign(draft)).toThrow('Sem espaço')
    expect(localStorage.getItem(campaignDraftStorageKey)).toBe(serialized)
    expect(loadCreatedCampaigns()).toEqual([])
  })

  it('não altera os registros ou o rascunho ao rejeitar dados inválidos', () => {
    localStorage.setItem(campaignDraftStorageKey, 'rascunho preservado')
    expect(() => activateCampaign(initialCampaignDraft)).toThrow()
    expect(localStorage.getItem(campaignDraftStorageKey)).toBe('rascunho preservado')
    localStorage.setItem(createdCampaignsStorageKey, 'conteúdo corrompido')
    expect(() => activateCampaign(validDraft())).toThrow()
    expect(localStorage.getItem(createdCampaignsStorageKey)).toBe('conteúdo corrompido')
  })
})
