import type { CampaignDraft } from '../../../types/campaign'
import { getCampaignReviewSections } from '../../../data/campaignReview'
import './CampaignReview.css'

export function CampaignReview({ draft }: { draft: CampaignDraft }) {
  const sections = getCampaignReviewSections(draft)

  return (
    <section className="create-campaign-information campaign-review" aria-labelledby="campaign-review-title">
      <h2 id="campaign-review-title" tabIndex={-1}>Revisão</h2>
      <p className="campaign-review-description">Revise a campanha antes de realizar a aceitação:</p>
      {sections.map(section => (
        <section className="campaign-review-section" key={section.title} aria-label={section.title}>
          <h3>{section.title}</h3>
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
