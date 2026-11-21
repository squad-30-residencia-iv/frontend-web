import { describe, expect, it } from 'vitest'
import { batchIsReady, selectBatchGroups } from './campaignBatch'
import { getBatchTotal, newCampaignBenefits, validateCampaignBenefits } from './campaignBenefits'

describe('Grupos de clientes do lote', () => {
  it('agrega grupos sem contar clientes compartilhados duas vezes', () => {
    const batch = selectBatchGroups(['demo-group-a', 'demo-group-b'])
    expect(batch?.groups.map(group => group.id)).toEqual(['demo-group-a', 'demo-group-b'])
    expect(batch?.customerCount).toBe(4)
    expect(batchIsReady(batch)).toBe(true)
  })
  it('ignora IDs desconhecidos e não duplica grupos selecionados', () => {
    expect(selectBatchGroups(['desconhecido'])).toBeNull()
    expect(selectBatchGroups([])).toBeNull()
    expect(selectBatchGroups(['demo-group-a', 'demo-group-a'])?.customerCount).toBe(2)
  })
  it('aceita outro catálogo e não libera grupo sem clientes', () => {
    const batch = selectBatchGroups(['empty'], [{ id: 'empty', name: 'Vazio', customerIds: [] }])
    expect(batch?.customerCount).toBe(0)
    expect(batchIsReady(batch)).toBe(false)
    expect(batchIsReady(null)).toBe(false)
  })
  it('calcula o total e bloqueia lote acima do limite ou sem grupo', () => {
    const benefits = { ...newCampaignBenefits(), generationMode: 'batch' as const, quantityPerCustomer: '2', maxVouchers: '3' }
    expect(getBatchTotal(benefits, 2)).toBe(4)
    expect(validateCampaignBenefits(benefits, undefined, 2).maxVouchers).toMatch(/excede/)
    expect(validateCampaignBenefits(benefits).customerBase).toMatch(/Selecione/)
  })
})
