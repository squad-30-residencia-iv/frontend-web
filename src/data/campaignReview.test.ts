import { describe, expect, it } from 'vitest'
import { initialCampaignDraft, validateCampaignDraft } from './campaignDraft'
import { getCampaignReviewSections } from './campaignReview'
import type { CampaignDraft } from '../types/campaign'

function validDraft(): CampaignDraft {
  return {
    ...initialCampaignDraft,
    information: { ...initialCampaignDraft.information, name: 'Campanha real' },
    scope: { ...initialCampaignDraft.scope, mode: 'network', networkChannels: ['physical'] },
  }
}

describe('Apresentação da revisão', () => {
  it('resolve IDs e formata reais, percentuais, lojas, alvos e lote sem modificar o estado', () => {
    const draft = validDraft()
    draft.benefits = {
      ...draft.benefits,
      discountType: 'fixed', fixedAmount: '99,50', application: 'specific',
      targetIds: ['category-fashion', 'category-shoes'], generationMode: 'batch',
      quantityPerCustomer: '2', addedBenefits: [{ type: 'percentage', value: '15' }],
    }
    draft.scope = { ...draft.scope, mode: 'stores', storeIds: ['store-center'], storeChannels: ['virtual'] }
    const original = JSON.stringify(draft)
    const sections = getCampaignReviewSections(draft)
    const fields = sections.flatMap(section => section.fields)
    const valueFor = (label: string) => fields.find(field => field.label === label)?.value

    expect(valueFor('Valor')).toMatch(/R\$\s*99,50/)
    expect(valueFor('Produto ou categoria')).toBe('Moda, Calçados')
    expect(valueFor('Rede')).toBe('001 — Loja Centro')
    expect(valueFor('Canais')).toBe('Virtual')
    expect(valueFor('Total previsto')).toBe('5.000 vouchers')
    expect(valueFor('Base de clientes')).toBe('Base 1 (2.500 clientes)')
    expect(valueFor('Benefícios adicionados')).toBe('15%')
    expect(JSON.stringify(draft)).toBe(original)
  })

  it('apresenta vazios opcionais e ausência de condições sem valores técnicos', () => {
    const draft = validDraft()
    draft.rules = { ...draft.rules, conditions: [], restrictions: [] }
    const sections = getCampaignReviewSections(draft)
    const text = sections.flatMap(section => section.fields.map(field => field.value)).join(' ')
    expect(text).toContain('Nenhuma condição adicionada')
    expect(text).toContain('Nenhuma restrição adicionada')
    expect(text).not.toMatch(/undefined|null|\[\]|\btrue\b|\bfalse\b/)
  })
})

describe('Validação geral antes de revisar/salvar', () => {
  it('aprova um rascunho completo', () => {
    expect(validateCampaignDraft(validDraft()).firstInvalid).toBeNull()
  })

  it.each([1, 2, 3, 4])('identifica a primeira etapa inválida: %s', stage => {
    const draft = validDraft()
    if (stage === 1) draft.information = { ...draft.information, name: '' }
    if (stage === 2) draft.benefits = { ...draft.benefits, percentage: '' }
    if (stage === 3) draft.rules = { ...draft.rules, audience: '' }
    if (stage === 4) draft.scope = { ...draft.scope, networkChannels: [] }

    expect(validateCampaignDraft(draft).firstInvalid?.step).toBe(stage)
  })

  it('prioriza o primeiro erro quando múltiplas seções estão inválidas', () => {
    const draft = validDraft()
    draft.information = { ...draft.information, name: '' }
    draft.scope = { ...draft.scope, networkChannels: [] }
    const validation = validateCampaignDraft(draft)
    expect(validation.firstInvalid).toEqual({ step: 1, field: 'name' })
    expect(validation.scope.networkChannels).toBeDefined()
  })
})
