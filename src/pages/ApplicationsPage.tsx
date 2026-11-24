import { useEffect, useMemo, useState } from 'react'
import { Plus, TriangleAlert, MonitorSmartphone } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { Button } from '../components/ui/Button'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { EmptyState } from '../components/ui/EmptyState'
import { Loading } from '../components/ui/Loading'
import { Select } from '../components/ui/Select'
import { useFeedback } from '../components/ui/useFeedback'
import { ApplicationsTable } from '../components/satellite/ApplicationsTable'
import { CreateSatelliteForm } from '../components/satellite/CreateSatelliteForm'
import { SecretRevealModal } from '../components/satellite/SecretRevealModal'
import { fetchNetworks } from '../services/registry'
import {
  createSatelliteApp,
  deactivateSatelliteApp,
  fetchSatelliteApps,
  rotateSatelliteSecret,
} from '../services/satellite'
import type { CreateSatelliteAppPayload, SatelliteApp } from '../types/satellite'
import './ApplicationsPage.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; apps: readonly SatelliteApp[] }

export interface ApplicationsPageProps {
  loadApps?: (networkId: string) => Promise<SatelliteApp[]>
  loadNetworks?: () => Promise<readonly { id: string; name: string }[]>
}

async function loadActiveNetworks() {
  const networks = await fetchNetworks()
  return networks.filter(network => network.isActive).map(network => ({ id: network.id, name: network.name }))
}

export function ApplicationsPage({
  loadApps = fetchSatelliteApps,
  loadNetworks = loadActiveNetworks,
}: ApplicationsPageProps) {
  const [networks, setNetworks] = useState<readonly { id: string; name: string }[]>([])
  const [networksReady, setNetworksReady] = useState(false)
  const [selectedNetworkId, setSelectedNetworkId] = useState('')
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [onlyActive, setOnlyActive] = useState<boolean>(true)

  // Modais de Criação
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Modais de Confirmação
  const [appToDeactivate, setAppToDeactivate] = useState<SatelliteApp | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const [appToRotate, setAppToRotate] = useState<SatelliteApp | null>(null)
  const [isRotating, setIsRotating] = useState(false)

  // Modal de Exibição Única de Segredo
  const [revealedSecret, setRevealedSecret] = useState<{
    secret: string
    title: string
    warning: string
  } | null>(null)

  const feedback = useFeedback()

  useEffect(() => {
    let cancelled = false
    loadNetworks()
      .then(list => {
        if (cancelled) return
        setNetworks(list)
        setSelectedNetworkId(current => current && list.some(network => network.id === current) ? current : list[0]?.id ?? '')
        setNetworksReady(true)
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [loadNetworks])

  useEffect(() => {
    if (!networksReady) return
    if (!selectedNetworkId) {
      setState({ status: 'success', apps: [] })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    loadApps(selectedNetworkId)
      .then(apps => {
        if (!cancelled) setState({ status: 'success', apps })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [selectedNetworkId, attempt, loadApps, networksReady])

  function retry() {
    setAttempt(c => c + 1)
  }

  // Estatísticas calculadas sobre todas as aplicações da rede
  const stats = useMemo(() => {
    if (state.status !== 'success') return { total: 0, active: 0, inactive: 0 }
    const total = state.apps.length
    const active = state.apps.filter(a => a.active).length
    const inactive = total - active
    return { total, active, inactive }
  }, [state])

  // Aplicações filtradas pela visualização (ativas vs todas)
  const visibleApps = useMemo(() => {
    if (state.status !== 'success') return []
    if (onlyActive) {
      return state.apps.filter(a => a.active)
    }
    return state.apps
  }, [state, onlyActive])

  // Ação: Criar Aplicação
  async function handleCreateApp(payload: CreateSatelliteAppPayload) {
    setIsCreating(true)
    try {
      const response = await createSatelliteApp(payload)
      setIsCreateOpen(false)
      feedback.success({
        title: 'Aplicação criada com sucesso!',
        description: `Aplicação "${response.app.name}" foi registrada.`,
      })
      // Revela o segredo gerado pela primeira e única vez
      setRevealedSecret({
        secret: response.clientSecret,
        title: 'Segredo de cliente gerado',
        warning:
          'Atenção: Este segredo só será exibido esta única vez. Copie e guarde em local seguro. Ele não poderá ser recuperado posteriormente e não será mostrado no detalhe nem na listagem.',
      })
      // Se criou em outra rede, muda para a rede da nova aplicação para visualizá-la
      if (payload.networkId !== selectedNetworkId) {
        setSelectedNetworkId(payload.networkId)
      } else {
        setAttempt(c => c + 1)
      }
    } catch {
      feedback.error({
        title: 'Não foi possível criar a aplicação',
        description: 'Verifique se o Client ID já está em uso e tente novamente.',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Ação: Inativar Aplicação
  async function handleConfirmDeactivate() {
    if (!appToDeactivate) return
    setIsDeactivating(true)
    try {
      await deactivateSatelliteApp(appToDeactivate.id)
      feedback.success({
        title: 'Aplicação inativada',
        description: `A aplicação "${appToDeactivate.name}" foi inativada e retirada da lista de ativas.`,
      })
      setAppToDeactivate(null)
      setAttempt(c => c + 1)
    } catch {
      feedback.error({
        title: 'Falha ao inativar aplicação',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  // Ação: Rotacionar Segredo
  async function handleConfirmRotate() {
    if (!appToRotate) return
    setIsRotating(true)
    try {
      const response = await rotateSatelliteSecret(appToRotate.id)
      const appName = appToRotate.name
      setAppToRotate(null)
      feedback.success({
        title: 'Segredo rotacionado com sucesso',
        description: `Um novo segredo foi gerado para "${appName}".`,
      })
      // Revela o novo segredo gerado pela primeira e única vez
      setRevealedSecret({
        secret: response.clientSecret,
        title: 'Novo segredo gerado',
        warning:
          'O segredo anterior parou de valer para tokens novos. Atualize a credencial no PDV ou e-commerce. Este segredo não será exibido de novo.',
      })
    } catch {
      feedback.error({
        title: 'Não foi possível rotacionar o segredo',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setIsRotating(false)
    }
  }

  const selectedNetworkName = networks.find(network => network.id === selectedNetworkId)?.name ?? 'rede'
  const networkOptions = networks.map(network => ({ value: network.id, label: network.name }))

  return (
    <PortalLayout activeSection="applications">
      <div className="applications-page" aria-busy={state.status === 'loading'}>
        <PageHeader
          title="Aplicações Satélite"
          subtitle="Gerencie as aplicações e credenciais de integração da rede selecionada."
          breadcrumbs={[{ label: 'Portal', href: '/home' }, { label: 'Aplicações' }]}
          action={
            <Button
              startIcon={Plus}
              onPress={() => setIsCreateOpen(true)}
              aria-label="Cadastrar nova aplicação satélite"
            >
              Nova aplicação
            </Button>
          }
        />

        {/* Indicadores */}
        <section className="applications-summary" aria-label="Indicadores da rede">
          <article className="applications-summary-card">
            <h2>Total na {selectedNetworkName}</h2>
            <strong>{stats.total}</strong>
          </article>
          <article className="applications-summary-card">
            <h2>Aplicações Ativas</h2>
            <strong style={{ color: 'var(--success)' }}>{stats.active}</strong>
          </article>
          <article className="applications-summary-card">
            <h2>Aplicações Inativas</h2>
            <strong style={{ color: 'var(--muted)' }}>{stats.inactive}</strong>
          </article>
        </section>

        {/* Barra de Filtro de Rede e Toggle de Ativas */}
        <div className="applications-controls">
          <div className="applications-filter-network">
            <Select
              label="Rede:"
              options={networkOptions}
              selectedKey={selectedNetworkId}
              onSelectionChange={key => setSelectedNetworkId(String(key))}
            />
          </div>

          <label className="applications-view-toggle">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={e => setOnlyActive(e.target.checked)}
            />
            <span>Exibir apenas aplicações ativas</span>
          </label>
        </div>

        {/* Estados de Carregamento e Tabela */}
        {state.status === 'loading' && (
          <Loading message="Carregando aplicações da rede…" />
        )}

        {state.status === 'error' && (
          <div role="alert">
            <EmptyState
              icon={TriangleAlert}
              title="Não foi possível carregar as aplicações"
              description="Ocorreu um erro ao buscar as aplicações desta rede."
              action={
                <Button variant="secondary" onPress={retry}>
                  Tentar novamente
                </Button>
              }
            />
          </div>
        )}

        {state.status === 'success' && visibleApps.length === 0 && (
          <EmptyState
            icon={MonitorSmartphone}
            title={
              onlyActive
                ? `Nenhuma aplicação ativa encontrada na ${selectedNetworkName}`
                : `Nenhuma aplicação cadastrada na ${selectedNetworkName}`
            }
            description={
              onlyActive
                ? 'Todas as aplicações desta rede estão inativas ou ainda não foram cadastradas.'
                : 'Clique no botão acima para cadastrar a primeira aplicação desta rede.'
            }
            action={
              <Button onPress={() => setIsCreateOpen(true)} startIcon={Plus}>
                Cadastrar aplicação
              </Button>
            }
          />
        )}

        {state.status === 'success' && visibleApps.length > 0 && (
          <ApplicationsTable
            applications={visibleApps}
            onDeactivate={app => setAppToDeactivate(app)}
            onRotateSecret={app => setAppToRotate(app)}
          />
        )}

        {/* Modal: Formulário de Criação */}
        <CreateSatelliteForm
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handleCreateApp}
          isPending={isCreating}
          defaultNetworkId={selectedNetworkId}
          networks={networks}
        />

        {/* Modal: Confirmação de Inativação */}
        {appToDeactivate && (
          <ConfirmationModal
            isOpen={Boolean(appToDeactivate)}
            onOpenChange={open => !open && setAppToDeactivate(null)}
            action="deactivate"
            itemName={`a aplicação "${appToDeactivate.name}"`}
            onConfirm={handleConfirmDeactivate}
            isPending={isDeactivating}
          />
        )}

        {/* Modal: Confirmação de Rotação de Segredo */}
        {appToRotate && (
          <ConfirmationModal
            isOpen={Boolean(appToRotate)}
            onOpenChange={open => !open && setAppToRotate(null)}
            action="approve"
            itemName={`a rotação de segredo da aplicação "${appToRotate.name}"`}
            onConfirm={handleConfirmRotate}
            isPending={isRotating}
          />
        )}

        {/* Modal: Exibição Única de Segredo */}
        {revealedSecret && (
          <SecretRevealModal
            isOpen={Boolean(revealedSecret)}
            onOpenChange={open => !open && setRevealedSecret(null)}
            clientSecret={revealedSecret.secret}
            title={revealedSecret.title}
            warning={revealedSecret.warning}
          />
        )}
      </div>
    </PortalLayout>
  )
}
