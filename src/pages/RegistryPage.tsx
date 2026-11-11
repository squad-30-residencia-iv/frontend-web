import { useState, type Key } from 'react'
import { Tabs } from '@heroui/react'
import { Lock } from 'lucide-react'
import { CatalogPanel } from '../components/registry/CatalogPanel'
import { HierarchyPanel, type HierarchySelection } from '../components/registry/HierarchyPanel'
import { useRegistryEditor } from '../components/registry/useRegistryEditor'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../contexts/AuthContext'
import './RegistryPage.css'

type RegistryTab = 'hierarchy' | 'catalog'

const breadcrumbs = [{ label: 'Portal' }, { label: 'Cadastros' }]

function RegistryWorkspace() {
  const [tab, setTab] = useState<RegistryTab>('hierarchy')
  const [hierarchy, setHierarchy] = useState<HierarchySelection>({ networkId: null, regionId: null })
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const editor = useRegistryEditor(() => setRefreshKey(current => current + 1))

  function handleTabChange(key: Key) {
    setTab(key === 'catalog' ? 'catalog' : 'hierarchy')
  }

  return <>
    <Tabs className="registry-tabs" selectedKey={tab} onSelectionChange={handleTabChange}>
      <Tabs.List className="registry-tab-list" aria-label="Tipo de cadastro">
        <Tabs.Tab id="hierarchy">Hierarquia<Tabs.Indicator /></Tabs.Tab>
        <Tabs.Tab id="catalog">Catálogo<Tabs.Indicator /></Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="hierarchy" className="registry-tab-panel">
        <p className="registry-tab-hint">Escolha a rede para ver as regiões e a região para ver as lojas.</p>
        <HierarchyPanel
          selection={hierarchy}
          onSelectionChange={setHierarchy}
          refreshKey={refreshKey}
          editor={editor.actions}
          reactivatingId={editor.reactivatingId}
        />
      </Tabs.Panel>
      <Tabs.Panel id="catalog" className="registry-tab-panel">
        <p className="registry-tab-hint">O catálogo vale para todas as redes. Escolha a categoria para ver os produtos.</p>
        <CatalogPanel
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          refreshKey={refreshKey}
          editor={editor.actions}
          reactivatingId={editor.reactivatingId}
        />
      </Tabs.Panel>
    </Tabs>
    {editor.dialogs}
  </>
}

/** Cadastros de rede, região, loja, categoria e produto. Só o administrador usa. */
export function RegistryPage() {
  const { user } = useAuth()
  const isAdministrator = user?.role === 'administrador'

  return <PortalLayout activeSection="registry">
    <PageHeader
      title="Cadastros"
      breadcrumbs={breadcrumbs}
      subtitle="Rede, regiões, lojas, categorias e produtos usados nas campanhas."
    />
    {isAdministrator
      ? <RegistryWorkspace />
      : <section className="registry-denied" aria-label="Acesso aos cadastros">
          <EmptyState
            icon={Lock}
            title="Acesso restrito"
            description="Somente o administrador cadastra e altera rede, região, loja, categoria e produto."
          />
        </section>}
  </PortalLayout>
}
