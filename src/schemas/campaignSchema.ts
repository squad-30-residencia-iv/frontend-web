import { z } from 'zod'
import { campaignInformationSchema } from '../data/campaignDraft'
import { campaignBenefitsSchema } from '../data/campaignBenefits'
import { campaignRulesSchema } from '../data/campaignRules'
import { campaignScopeSchema } from '../data/campaignScope'

export { campaignInformationSchema, campaignBenefitsSchema, campaignRulesSchema, campaignScopeSchema }

export const campaignSchema = z.object({
  information: campaignInformationSchema,
  benefits: campaignBenefitsSchema,
  rules: campaignRulesSchema,
  scope: campaignScopeSchema,
})
