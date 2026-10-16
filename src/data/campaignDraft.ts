import { createFormSchema, formErrors } from '../schemas/validation'
import type { CampaignDraft } from '../types/campaign'
import { isCampaignBenefits, newCampaignBenefits, validateCampaignBenefits } from './campaignBenefits'
import { isCampaignRules, newCampaignRules, validateCampaignRules } from './campaignRules'
import { isCampaignScope, newCampaignScope, validateCampaignScope } from './campaignScope'

export const campaignDraftStorageKey = 'portal-campaigns:creation-draft:v1'
export const initialCampaignDraft: CampaignDraft = {
  information: {
    name: '',
    start: '2026-10-01T08:00',
    end: '2026-10-31T23:59',
    voucherModel: 'relative',
    voucherDurationDays: '30',
    voucherCap: 'unlimited',
  },
  benefits: newCampaignBenefits(),
  rules: newCampaignRules(),
  scope: newCampaignScope(),
}

function isCampaignDraft(value: unknown): value is Pick<CampaignDraft, 'information'> {
  if (!value || typeof value !== 'object' || !('information' in value)) return false
  const information = value.information
  return Boolean(information && typeof information === 'object'
    && 'name' in information && typeof information.name === 'string'
    && 'start' in information && typeof information.start === 'string'
    && 'end' in information && typeof information.end === 'string'
    && 'voucherModel' in information && (information.voucherModel === 'relative' || information.voucherModel === '')
    && 'voucherDurationDays' in information && typeof information.voucherDurationDays === 'string'
    && 'voucherCap' in information && (information.voucherCap === 'unlimited' || information.voucherCap === ''))
}

export function loadCampaignDraft(): CampaignDraft {
  try {
    const stored = localStorage.getItem(campaignDraftStorageKey)
    const value: unknown = stored ? JSON.parse(stored) : null
    if (isCampaignDraft(value)) {
      const benefits = 'benefits' in value && isCampaignBenefits(value.benefits) ? value.benefits : newCampaignBenefits()
      const rules = 'rules' in value && isCampaignRules(value.rules) ? value.rules : newCampaignRules()
      const scope = 'scope' in value && isCampaignScope(value.scope) ? value.scope : newCampaignScope()
      return { information: value.information, benefits, rules, scope }
    }
  } catch {
    // Armazenamento indisponível ou rascunho inválido: iniciar um formulário novo.
  }
  return { information: { ...initialCampaignDraft.information }, benefits: newCampaignBenefits(), rules: newCampaignRules(), scope: newCampaignScope() }
}

export type CampaignInformationErrors = Partial<Record<keyof CampaignDraft['information'], string>>

function isValidDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false
  const [year, month, day, hours, minutes] = value.split(/[-T:]/).map(Number)
  const date = new Date(year, month - 1, day, hours, minutes)
  return date.getFullYear() === year && date.getMonth() === month - 1
    && date.getDate() === day && date.getHours() === hours && date.getMinutes() === minutes
}

function collectCampaignInformationErrors({ information }: Pick<CampaignDraft, 'information'>): CampaignInformationErrors {
  const errors: CampaignInformationErrors = {}
  if (!information.name.trim()) errors.name = 'Informe o nome da campanha.'
  if (!isValidDateTime(information.start)) errors.start = 'Informe uma data e hora de início válidas.'
  if (!isValidDateTime(information.end)) errors.end = 'Informe uma data e hora de fim válidas.'
  if (!errors.start && !errors.end && information.end <= information.start) errors.end = 'O fim da vigência deve ser posterior ao início.'
  if (!information.voucherModel) errors.voucherModel = 'Selecione o modelo de validade.'
  const days = Number(information.voucherDurationDays)
  if (!information.voucherDurationDays.trim() || !Number.isSafeInteger(days) || days <= 0) errors.voucherDurationDays = 'Informe uma quantidade inteira de dias maior que zero.'
  if (!information.voucherCap) errors.voucherCap = 'Selecione o teto máximo.'
  return errors
}

export function validateCampaignDraft(draft: CampaignDraft) {
  const information = validateCampaignInformation(draft)
  const benefits = validateCampaignBenefits(draft.benefits)
  const rules = validateCampaignRules(draft.rules)
  const scope = validateCampaignScope(draft.scope)
  const stages = [
    { step: 1 as const, errors: information },
    { step: 2 as const, errors: benefits },
    { step: 3 as const, errors: rules },
    { step: 4 as const, errors: scope },
  ]
  const invalidStage = stages.find(stage => Object.keys(stage.errors).length > 0)

  return {
    information,
    benefits,
    rules,
    scope,
    firstInvalid: invalidStage
      ? { step: invalidStage.step, field: Object.keys(invalidStage.errors)[0] }
      : null,
  }
}

export const campaignInformationSchema = createFormSchema(
  (value: unknown): value is CampaignDraft['information'] => isCampaignDraft({ information: value }),
  information => collectCampaignInformationErrors({ information }),
)

export function validateCampaignInformation(value: CampaignDraft): CampaignInformationErrors {
  return formErrors(campaignInformationSchema, value.information)
}
