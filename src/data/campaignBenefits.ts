import { createFormSchema, formErrors } from '../schemas/validation'
import type { CampaignBenefit, CampaignDraft } from '../types/campaign'

export const MaxCampaignItems = 1000
export const categoryOptions = [{ value: 'category-fashion', label: 'Moda' }, { value: 'category-shoes', label: 'Calçados' }, { value: 'category-home', label: 'Casa' }]
export const productOptions = [
  { value: 'product-shirt', label: 'Camiseta demonstrativa', code: 'CAM-DEMO' },
  { value: 'product-shoes', label: 'Tênis demonstrativo', code: 'TEN-DEMO' },
]

/** Primeiro token da linha, para aceitar `CODIGO — nome` além do código sozinho. */
export function productCodeFromEntry(entry: string): string {
  const trimmed = entry.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+[—–-]\s+/)[0]?.trim() ?? trimmed
}

/** Códigos únicos, sem diferenciar maiúsculas; a primeira grafia informada permanece. */
export function parseProductCodes(text: string): string[] {
  const seen = new Set<string>()
  const codes: string[] = []
  for (const part of text.split(/[\n,;]+/)) {
    const code = productCodeFromEntry(part)
    if (!code) continue
    const key = code.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    codes.push(code)
  }
  return codes
}

export function targetOptionLabel(option: { label: string; code?: string }) {
  return option.code ? `${option.code} — ${option.label}` : option.label
}

/** Cola códigos no seletor: marca o produto do catálogo e grava o código no lote. */
export function applyProductCodeBatch(
  currentIds: readonly string[],
  currentCodes: string,
  pasted: string,
  products: BenefitCatalog['products'] = [],
) {
  const codes = parseProductCodes(pasted)
  const extraIds = codes.flatMap(code => {
    const product = products.find(item => item.code?.toLowerCase() === code.toLowerCase())
    return product && !currentIds.includes(product.value) ? [product.value] : []
  })
  return {
    targetIds: [...currentIds, ...extraIds],
    productCodes: parseProductCodes([currentCodes, pasted].join('\n')).join('\n'),
  }
}

export const initialCampaignBenefits: CampaignDraft['benefits'] = {
  maximumDiscount: '', discountType: 'percentage', percentage: '20', fixedAmount: '200,00', addedBenefits: [],
  application: 'total', targetType: 'category', targetIds: [], productCodes: '', maxVouchers: '1000',
  generationMode: 'automatic', quantityPerGrant: '1', limitPerCustomer: '1',
  customerBase: '', quantityPerCustomer: '1',
}
export type CampaignBenefitsErrors = Partial<Record<keyof CampaignDraft['benefits'], string>>
export function parseDiscount(value: string) {
  // Aceita decimais com vírgula ou ponto, sem separador de milhar ambíguo.
  return /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()) ? Number(value.trim().replace(',', '.')) : NaN
}
export function isPositiveInteger(value: string) { return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 }
export function validateDiscount(type: CampaignBenefit['type'], value: string) {
  const amount = parseDiscount(value)
  return Number.isFinite(amount) && amount > 0 && (type !== 'percentage' || (amount >= 1 && amount <= 100))
}
export function getBatchTotal(benefits: CampaignDraft['benefits'], customerCount = 0) {
  const total = customerCount * Number(benefits.quantityPerCustomer)
  return isPositiveInteger(benefits.quantityPerCustomer) && Number.isSafeInteger(total) ? total : 0
}
export interface BenefitCatalog {
  categories: readonly { value: string; label: string }[]
  products: readonly { value: string; label: string; code?: string }[]
}

export function unionProductTargetCount(
  benefits: CampaignDraft['benefits'],
  products: BenefitCatalog['products'] = [],
): number {
  const codes = parseProductCodes(benefits.productCodes ?? '')
  const keys = new Set(codes.map(code => code.toLowerCase()))
  const extra = benefits.targetIds.filter(id => {
    const option = products.find(product => product.value === id)
    const code = option?.code?.trim()
    return !(code && keys.has(code.toLowerCase()))
  }).length
  return codes.length + extra
}

function collectCampaignBenefitsErrors(
  benefits: CampaignDraft['benefits'],
  catalog: BenefitCatalog = { categories: categoryOptions, products: productOptions },
  batchCustomerCount = 0,
): CampaignBenefitsErrors {
  const errors: CampaignBenefitsErrors = {}
  const discountField = benefits.discountType === 'percentage' ? 'percentage' : 'fixedAmount'
  if (!validateDiscount(benefits.discountType, benefits[discountField])) errors[discountField] = benefits.discountType === 'percentage' ? 'Informe um percentual entre 1% e 100%.' : 'Informe um valor em reais maior que zero, com até duas casas decimais.'
  if (benefits.discountType === 'percentage' && benefits.maximumDiscount?.trim() && !validateDiscount('fixed', benefits.maximumDiscount)) errors.maximumDiscount = 'Informe um teto em reais maior que zero ou deixe em branco para não limitar.'
  if (benefits.addedBenefits.some(item => !validateDiscount(item.type, item.value) || (item.type === 'percentage' && Boolean(item.maximumDiscount?.trim()) && !validateDiscount('fixed', item.maximumDiscount ?? '')))) errors.addedBenefits = 'Revise os benefícios adicionados.'
  if (benefits.application === 'specific') {
    if (benefits.targetType === 'category') {
      const options = catalog.categories
      if (!benefits.targetIds.length || benefits.targetIds.some(id => !options.some(option => option.value === id))) {
        errors.targetIds = 'Selecione ao menos um produto ou categoria.'
      }
    } else {
      const options = catalog.products
      if (benefits.targetIds.some(id => !options.some(option => option.value === id))) {
        errors.targetIds = 'Selecione ao menos um produto ou categoria.'
      }
      const count = unionProductTargetCount(benefits, options)
      if (count === 0) {
        errors.targetIds = 'Selecione ao menos um produto ou informe códigos.'
        errors.productCodes = 'Informe ao menos um código ou selecione produtos.'
      } else if (count > MaxCampaignItems) {
        errors.productCodes = 'Informe no máximo 1.000 produtos (lista e seletor juntos).'
      }
    }
  }
  if (!isPositiveInteger(benefits.maxVouchers)) errors.maxVouchers = 'Informe uma quantidade máxima inteira maior que zero.'
  if (benefits.generationMode === 'automatic') {
    if (!isPositiveInteger(benefits.quantityPerGrant)) errors.quantityPerGrant = 'Informe uma quantidade por concessão inteira maior que zero.'
    if (!isPositiveInteger(benefits.limitPerCustomer)) errors.limitPerCustomer = 'Informe um limite por cliente inteiro maior que zero.'
  } else {
    if (!batchCustomerCount) errors.customerBase = 'Selecione ao menos um grupo com clientes para continuar.'
    if (!isPositiveInteger(benefits.quantityPerCustomer) || !Number.isSafeInteger(batchCustomerCount * Number(benefits.quantityPerCustomer))) errors.quantityPerCustomer = 'Informe uma quantidade por cliente inteira válida maior que zero.'
  }
  if (benefits.generationMode === 'batch' && getBatchTotal(benefits, batchCustomerCount) > Number(benefits.maxVouchers)) errors.maxVouchers = 'O total do lote excede a quantidade máxima da campanha.'
  return errors
}
export function isCampaignBenefits(value: unknown): value is CampaignDraft['benefits'] {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (item.maximumDiscount === undefined || typeof item.maximumDiscount === 'string')
    && (item.discountType === 'percentage' || item.discountType === 'fixed')
    && ['percentage', 'fixedAmount', 'maxVouchers', 'quantityPerGrant', 'limitPerCustomer', 'customerBase', 'quantityPerCustomer'].every(key => typeof item[key] === 'string')
    && (item.application === 'total' || item.application === 'specific')
    && (item.targetType === 'category' || item.targetType === 'product')
    && (item.generationMode === 'automatic' || item.generationMode === 'batch')
    && Array.isArray(item.targetIds) && item.targetIds.every(id => typeof id === 'string')
    && (item.productCodes === undefined || typeof item.productCodes === 'string')
    && Array.isArray(item.addedBenefits) && item.addedBenefits.every((benefit: unknown) => Boolean(benefit && typeof benefit === 'object' && 'type' in benefit && (benefit.type === 'percentage' || benefit.type === 'fixed') && 'value' in benefit && typeof benefit.value === 'string' && (!('maximumDiscount' in benefit) || typeof benefit.maximumDiscount === 'string')))
}
export function newCampaignBenefits(): CampaignDraft['benefits'] {
  return { ...initialCampaignBenefits, targetIds: [], productCodes: '', addedBenefits: [] }
}

export const campaignBenefitsSchema = createFormSchema(isCampaignBenefits, value => {
  const errors = collectCampaignBenefitsErrors(value)
  // A união dos grupos não entra no rascunho gravado; o assistente já conferiu a seleção.
  if (value.generationMode === 'batch') delete errors.customerBase
  return errors
})

export function validateCampaignBenefits(value: CampaignDraft['benefits'], catalog?: BenefitCatalog, batchCustomerCount = 0): CampaignBenefitsErrors {
  if (catalog || value.generationMode === 'batch') return collectCampaignBenefitsErrors(value, catalog, batchCustomerCount)
  return formErrors(campaignBenefitsSchema, value)
}
