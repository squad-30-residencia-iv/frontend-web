import { PageHeader } from '../components/shared/PageHeader'
import { PortalLayout } from '../components/layout/PortalLayout'
import { portalNavigation, type PortalSection } from '../components/layout/navigation'
import { EmptyState } from '../components/ui/EmptyState'


export type PlaceholderSection = Extract<PortalSection, 'vouchers' | 'reports' | 'audit'>

export interface SectionPlaceholderPageProps {
  section: PlaceholderSection
}

// Estado temporário das seções da Sidebar cujas telas ainda não existem.
export function SectionPlaceholderPage({ section }: SectionPlaceholderPageProps) {
  const item = portalNavigation.find(navigationItem => navigationItem.id === section)
  if (!item) return null

  return <PortalLayout activeSection={section}>
    <section className="section-placeholder" aria-labelledby="section-placeholder-title">
      <PageHeader title={item.label} titleId="section-placeholder-title" breadcrumbs={[{ label: 'Portal' }, { label: item.label }]} />
      <EmptyState
        icon={item.icon}
        title="Em construção"
        description={`A área de ${item.label} estará disponível em uma próxima etapa.`}
      />
    </section>
  </PortalLayout>
}
