import type { CampaignDraft } from '../types/campaign'
import { isCampaignBenefits, newCampaignBenefits } from './campaignBenefits'
import { isCampaignRules, newCampaignRules } from './campaignRules'
import { isCampaignScope, newCampaignScope } from './campaignScope'

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

export function validateCampaignInformation({ information }: CampaignDraft): CampaignInformationErrors {
  const errors: CampaignInformationErrors = {}
  if (!information.name.trim()) errors.name = 'Informe o nome da campanha.'
  if (!isValidDateTime(information.start)) errors.start = 'Informe uma data e hora de início válidas.'
  if (!isValidDateTime(information.end)) errors.end = 'Informe uma data e hora de fim válidas.'
  if (!errors.start && !errors.end && information.end < information.start) errors.end = 'O fim da vigência não pode ser anterior ao início.'
  if (!information.voucherModel) errors.voucherModel = 'Selecione o modelo de validade.'
  const days = Number(information.voucherDurationDays)
  if (!information.voucherDurationDays.trim() || !Number.isSafeInteger(days) || days <= 0) errors.voucherDurationDays = 'Informe uma quantidade inteira de dias maior que zero.'
  if (!information.voucherCap) errors.voucherCap = 'Selecione o teto máximo.'
  return errors
}
