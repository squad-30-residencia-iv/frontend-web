import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { CategoryFilter, allCategoriesId } from '../components/home/CategoryFilter'
import { FeaturedBanner } from '../components/home/FeaturedBanner'
import { HomeCampaignCard } from '../components/home/HomeCampaignCard'
import { HomeGreeting } from '../components/home/HomeGreeting'
import { PortalLayout } from '../components/layout/PortalLayout'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { currentUser } from '../data/currentUser'
import { fetchHomeOverview } from '../data/homeOverview'
import { navigate } from '../navigation/navigate'
import type { FeaturedCampaign, HomeOverview } from '../types/home'
import './HomePage.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; overview: HomeOverview }

export interface HomePageProps {
  /** Mantenha a referência estável (função de módulo ou useCallback): ela dispara o carregamento. */
  loadOverview?: () => Promise<HomeOverview>
}

export function HomePage({ loadOverview = fetchHomeOverview }: HomePageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadOverview()
      .then(overview => {
        if (!cancelled) setState({ status: 'success', overview })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => { cancelled = true }
  }, [loadOverview, attempt])

  function handleRetry() {
    setState({ status: 'loading' })
    setAttempt(current => current + 1)
  }

  return <PortalLayout activeSection="home">
    <div className="home-page" aria-busy={state.status === 'loading'}>
      <HomeGreeting user={currentUser} />
      {state.status === 'loading' && <Loading message="Carregando campanhas…" />}
      {state.status === 'error' && <EmptyState
        icon={TriangleAlert}
        title="Não foi possível carregar as campanhas"
        description="Verifique sua conexão e tente novamente."
        action={<Button variant="secondary" onPress={handleRetry}>Tentar novamente</Button>}
      />}
      {state.status === 'success' && <HomeContent overview={state.overview} />}
    </div>
  </PortalLayout>
}

function HomeContent({ overview }: { overview: HomeOverview }) {
  const [categoryId, setCategoryId] = useState(allCategoriesId)
  const categoryLabels = new Map(overview.categories.map(category => [category.id, category.label]))
  const visibleCampaigns = categoryId === allCategoriesId
    ? overview.campaigns
    : overview.campaigns.filter(campaign => campaign.categoryId === categoryId)

  function handleOpenFeatured(featured: FeaturedCampaign) {
    navigate(featured.ctaPath)
  }

  function handleShowAll() {
    setCategoryId(allCategoriesId)
  }

  return <>
    <FeaturedBanner campaign={overview.featured} onOpen={handleOpenFeatured} />
    <section className="home-campaigns" aria-labelledby="home-campaigns-title">
      <h2 className="home-campaigns-title" id="home-campaigns-title">Campanhas</h2>
      <CategoryFilter
        categories={overview.categories}
        selectedId={categoryId}
        onChange={setCategoryId}
      />
      {visibleCampaigns.length === 0 ? <EmptyState
        title="Nenhuma campanha nesta categoria"
        description="Escolha outra categoria para ver mais campanhas."
        action={<Button variant="secondary" onPress={handleShowAll}>Ver todas as campanhas</Button>}
      /> : <div className="home-grid">
        {visibleCampaigns.map(campaign => <HomeCampaignCard
          key={campaign.id}
          campaign={campaign}
          categoryLabel={categoryLabels.get(campaign.categoryId) ?? 'Sem categoria'}
        />)}
      </div>}
    </section>
  </>
}
