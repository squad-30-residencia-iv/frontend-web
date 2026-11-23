import { describe, expect, it } from 'vitest'
import {
  applyProductCodeBatch,
  MaxCampaignItems,
  parseProductCodes,
  unionProductTargetCount,
  validateCampaignBenefits,
  initialCampaignBenefits,
} from './campaignBenefits'

describe('parseProductCodes', () => {
  it('quebra linha, vírgula e ponto e vírgula, ignora vazios e preserva a primeira grafia', () => {
    expect(parseProductCodes('  CAM-1 \ncam-1; SKU-2, SKU-3\n\n')).toEqual(['CAM-1', 'SKU-2', 'SKU-3'])
  })

  it('aceita código junto do nome do produto', () => {
    expect(parseProductCodes('CAM-1 — Camiseta\nTEN-1 - Tênis')).toEqual(['CAM-1', 'TEN-1'])
  })
})

describe('validação de alvos de produto', () => {
  const products = [
    { value: 'p1', label: 'Camiseta', code: 'CAM-DEMO' },
    { value: 'p2', label: 'Tênis', code: 'TEN-DEMO' },
  ]

  it('aceita só códigos ou só seletor e recusa lista vazia', () => {
    const base = { ...initialCampaignBenefits, application: 'specific' as const, targetType: 'product' as const }
    expect(validateCampaignBenefits({ ...base, targetIds: [], productCodes: '' }, { categories: [], products }).productCodes)
      .toMatch(/código/)
    expect(validateCampaignBenefits({ ...base, targetIds: [], productCodes: 'CAM-DEMO' }, { categories: [], products })).toEqual({})
    expect(validateCampaignBenefits({ ...base, targetIds: ['p1'], productCodes: '' }, { categories: [], products })).toEqual({})
  })

  it('une seletor e lista e recusa mais de 1.000 alvos', () => {
    const benefits = {
      ...initialCampaignBenefits,
      application: 'specific' as const,
      targetType: 'product' as const,
      targetIds: ['p1', 'p2'],
      productCodes: 'CAM-DEMO',
    }
    expect(unionProductTargetCount(benefits, products)).toBe(2)
    const overflow = {
      ...benefits,
      targetIds: [],
      productCodes: Array.from({ length: MaxCampaignItems + 1 }, (_, index) => `SKU-${index}`).join('\n'),
    }
    expect(validateCampaignBenefits(overflow, { categories: [], products }).productCodes).toMatch(/1\.000/)
  })

  it('marca no seletor o produto do catálogo e grava o código no lote', () => {
    expect(applyProductCodeBatch([], '', 'CAM-DEMO — Camiseta\nZZZ-1', products)).toEqual({
      targetIds: ['p1'],
      productCodes: 'CAM-DEMO\nZZZ-1',
    })
  })
})
