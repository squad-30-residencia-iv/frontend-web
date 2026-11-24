import type { CampaignDraft } from '../../../types/campaign'
import { getCampaignReviewSections } from '../../../data/campaignReview'
import type { BenefitCatalog } from '../../../data/campaignBenefits'
import type { CampaignStore } from '../../../data/campaignScope'
import { Button } from '../../ui/Button'
import './CampaignReview.css'

export function CampaignReview({ draft, catalog, batchCustomerCount = 0, batchGroupNames = [], onEditStep }: {
  draft: CampaignDraft
  batchCustomerCount?: number
  batchGroupNames?: readonly string[]
  catalog?: { categories?: BenefitCatalog['categories']; products?: BenefitCatalog['products']; stores?: readonly CampaignStore[] }
  onEditStep: (step: 1 | 2 | 3 | 4) => void
}) {
  const sections = getCampaignReviewSections(draft, catalog, batchCustomerCount, batchGroupNames)

  return (
    <section className="create-campaign-information campaign-review" aria-labelledby="campaign-review-title">
      <h2 id="campaign-review-title" tabIndex={-1}>Revisão</h2>
      <p className="campaign-review-description">Revise a campanha antes de realizar a aceitação:</p>
      {sections.map(section => (
        <section className="campaign-review-section" key={section.title} aria-label={section.title}>
          <div className="campaign-review-heading">
            <h3>{section.title}</h3>
            <Button type="button" variant="ghost" aria-label={`Editar ${section.title}`} onPress={() => onEditStep(section.step)}>Editar</Button>
          </div>
          <dl className="campaign-review-card">
            {section.fields.map(field => (
              <div className="campaign-review-field" key={field.label}>
                <dt>{field.label}:</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </section>
  )
}
