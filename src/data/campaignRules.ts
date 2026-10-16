import { createFormSchema, formErrors } from '../schemas/validation'
import type { CampaignCondition, CampaignDraft, CampaignRestriction } from '../types/campaign'
import { parseDiscount } from './campaignBenefits'

export function newCampaignRules(): CampaignDraft['rules'] {
  return {
    audience: 'all', conditionMatch: 'all', restrictionMatch: 'all',
    conditions: [{ id: 'condition-initial', type: 'purchase-total', operator: 'gte', value: '200,00' }],
    restrictions: [{ id: 'restriction-initial', type: 'purchase-value', minimum: '100,00', maximum: '' }],
  }
}

export type CampaignRulesErrors = Partial<Record<string, string>>
export function conditionFieldName(id: string, field: 'type' | 'operator' | 'value') { return `condition-${id}-${field}` }
export function restrictionFieldName(id: string, field: 'type' | 'minimum' | 'maximum') { return `restriction-${id}-${field}` }
function isValidMoney(value: string) { const amount = parseDiscount(value); return Number.isFinite(amount) && amount >= 0 }

function collectCampaignRulesErrors(rules: CampaignDraft['rules']): CampaignRulesErrors {
  const errors: CampaignRulesErrors = {}
  if (!rules.audience) errors.audience = 'Selecione o público elegível.'
  for (const item of rules.conditions) {
    if (!item.type) errors[conditionFieldName(item.id, 'type')] = 'Selecione o tipo de condição.'
    if (!item.operator) errors[conditionFieldName(item.id, 'operator')] = 'Selecione o operador.'
    if (!isValidMoney(item.value)) errors[conditionFieldName(item.id, 'value')] = 'Informe um valor válido, não negativo e com até duas casas decimais.'
  }
  for (const item of rules.restrictions) {
    if (!item.type) errors[restrictionFieldName(item.id, 'type')] = 'Selecione o tipo de restrição.'
    if (!isValidMoney(item.minimum)) errors[restrictionFieldName(item.id, 'minimum')] = 'Informe um mínimo válido, não negativo e com até duas casas decimais.'
    if (item.maximum.trim()) {
      if (!isValidMoney(item.maximum)) errors[restrictionFieldName(item.id, 'maximum')] = 'Informe um máximo válido ou deixe sem limite.'
      else if (isValidMoney(item.minimum) && parseDiscount(item.maximum) < parseDiscount(item.minimum)) errors[restrictionFieldName(item.id, 'maximum')] = 'O máximo não pode ser menor que o mínimo.'
    }
  }
  return errors
}

function isCondition(value: unknown): value is CampaignCondition {
  if (!value || typeof value !== 'object') return false
  return 'id' in value && typeof value.id === 'string' && /^[a-zA-Z0-9-]+$/.test(value.id)
    && 'type' in value && (value.type === 'purchase-total' || value.type === '')
    && 'operator' in value && (value.operator === 'gte' || value.operator === '')
    && 'value' in value && typeof value.value === 'string'
}
function isRestriction(value: unknown): value is CampaignRestriction {
  if (!value || typeof value !== 'object') return false
  return 'id' in value && typeof value.id === 'string' && /^[a-zA-Z0-9-]+$/.test(value.id)
    && 'type' in value && (value.type === 'purchase-value' || value.type === '')
    && 'minimum' in value && typeof value.minimum === 'string'
    && 'maximum' in value && typeof value.maximum === 'string'
}
export function isCampaignRules(value: unknown): value is CampaignDraft['rules'] {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (item.audience === 'all' || item.audience === '')
    && (item.conditionMatch === 'all' || item.conditionMatch === 'any')
    && (item.restrictionMatch === 'all' || item.restrictionMatch === 'any')
    && Array.isArray(item.conditions) && item.conditions.every(isCondition)
    && new Set(item.conditions.map(condition => condition.id)).size === item.conditions.length
    && Array.isArray(item.restrictions) && item.restrictions.every(isRestriction)
    && new Set(item.restrictions.map(restriction => restriction.id)).size === item.restrictions.length
}

export const campaignRulesSchema = createFormSchema(isCampaignRules, collectCampaignRulesErrors)

export function validateCampaignRules(value: CampaignDraft['rules']): CampaignRulesErrors {
  return formErrors(campaignRulesSchema, value)
}
