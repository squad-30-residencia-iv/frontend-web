import type { CampaignBenefit, CampaignDraft } from '../types/campaign'

export const categoryOptions = [{ value: 'category-fashion', label: 'Moda' }, { value: 'category-shoes', label: 'Calçados' }, { value: 'category-home', label: 'Casa' }]
export const productOptions = [{ value: 'product-shirt', label: 'Camiseta demonstrativa' }, { value: 'product-shoes', label: 'Tênis demonstrativo' }]
export const customerBases = [{ value: 'base-1', label: '1', customers: 2500 }]
export const initialCampaignBenefits: CampaignDraft['benefits'] = {
  discountType: 'percentage', percentage: '20', fixedAmount: '200,00', addedBenefits: [],
  application: 'total', targetType: 'category', targetIds: [], maxVouchers: '1000',
  generationMode: 'automatic', quantityPerGrant: '1', limitPerCustomer: '1',
  customerBase: 'base-1', quantityPerCustomer: '1',
}
export type CampaignBenefitsErrors = Partial<Record<keyof CampaignDraft['benefits'], string>>
export function parseDiscount(value: string) {
  // Aceita decimais com vírgula ou ponto, sem separador de milhar ambíguo.
  return /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()) ? Number(value.trim().replace(',', '.')) : NaN
}
export function isPositiveInteger(value: string) { return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 }
export function validateDiscount(type: CampaignBenefit['type'], value: string) {
  const amount = parseDiscount(value)
  return Number.isFinite(amount) && amount > 0 && (type !== 'percentage' || amount <= 100)
}
export function getBatchTotal(benefits: CampaignDraft['benefits']) {
  const base = customerBases.find(item => item.value === benefits.customerBase)
  const total = (base?.customers ?? 0) * Number(benefits.quantityPerCustomer)
  return isPositiveInteger(benefits.quantityPerCustomer) && Number.isSafeInteger(total) ? total : 0
}
export function validateCampaignBenefits(benefits: CampaignDraft['benefits']): CampaignBenefitsErrors {
  const errors: CampaignBenefitsErrors = {}
  const discountField = benefits.discountType === 'percentage' ? 'percentage' : 'fixedAmount'
  if (!validateDiscount(benefits.discountType, benefits[discountField])) errors[discountField] = benefits.discountType === 'percentage' ? 'Informe um percentual maior que zero e até 100%.' : 'Informe um valor em reais maior que zero, com até duas casas decimais.'
  if (benefits.addedBenefits.some(item => !validateDiscount(item.type, item.value))) errors.addedBenefits = 'Revise os benefícios adicionados.'
  if (benefits.application === 'specific') {
    const options = benefits.targetType === 'category' ? categoryOptions : productOptions
    if (!benefits.targetIds.length || benefits.targetIds.some(id => !options.some(option => option.value === id))) errors.targetIds = 'Selecione ao menos um produto ou categoria.'
  }
  if (!isPositiveInteger(benefits.maxVouchers)) errors.maxVouchers = 'Informe uma quantidade máxima inteira maior que zero.'
  if (benefits.generationMode === 'automatic') {
    if (!isPositiveInteger(benefits.quantityPerGrant)) errors.quantityPerGrant = 'Informe uma quantidade por concessão inteira maior que zero.'
    if (!isPositiveInteger(benefits.limitPerCustomer)) errors.limitPerCustomer = 'Informe um limite por cliente inteiro maior que zero.'
  } else {
    if (!customerBases.some(base => base.value === benefits.customerBase)) errors.customerBase = 'Selecione uma base de clientes.'
    if (!isPositiveInteger(benefits.quantityPerCustomer) || !getBatchTotal(benefits)) errors.quantityPerCustomer = 'Informe uma quantidade por cliente inteira válida maior que zero.'
  }
  return errors
}
export function isCampaignBenefits(value: unknown): value is CampaignDraft['benefits'] {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (item.discountType === 'percentage' || item.discountType === 'fixed')
    && ['percentage', 'fixedAmount', 'maxVouchers', 'quantityPerGrant', 'limitPerCustomer', 'customerBase', 'quantityPerCustomer'].every(key => typeof item[key] === 'string')
    && (item.application === 'total' || item.application === 'specific')
    && (item.targetType === 'category' || item.targetType === 'product')
    && (item.generationMode === 'automatic' || item.generationMode === 'batch')
    && Array.isArray(item.targetIds) && item.targetIds.every(id => typeof id === 'string')
    && Array.isArray(item.addedBenefits) && item.addedBenefits.every((benefit: unknown) => Boolean(benefit && typeof benefit === 'object' && 'type' in benefit && (benefit.type === 'percentage' || benefit.type === 'fixed') && 'value' in benefit && typeof benefit.value === 'string'))
}
export function newCampaignBenefits(): CampaignDraft['benefits'] {
  return { ...initialCampaignBenefits, targetIds: [], addedBenefits: [] }
}
