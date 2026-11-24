import { useEffect, useId, useState, type FormEvent } from 'react'
import { Lock, Users } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { FeedbackAlert } from '../components/ui/FeedbackAlert'
import { Input } from '../components/ui/Input'
import { Loading } from '../components/ui/Loading'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useFeedback } from '../components/ui/useFeedback'
import { useAuth } from '../contexts/AuthContext'
import { fetchNetworks } from '../services/registry'
import {
  activateCustomerGroup,
  createCustomerGroup,
  fetchCustomerGroups,
  inactivateCustomerGroup,
  parseCpfList,
  replaceCustomerGroupMembers,
  type CustomerGroup,
} from '../services/customerGroups'
import './CustomerGroupsPage.css'

export function CustomerGroupsPage() {
  const { user } = useAuth()
  const isAdministrator = user?.role === 'administrador'
  return <PortalLayout activeSection="customerGroups">
    <PageHeader
      title="Grupos de clientes"
      breadcrumbs={[{ label: 'Portal' }, { label: 'Grupos' }]}
      subtitle="CPFs reutilizados nas campanhas em lote. A emissão dos vouchers fica para uma entrega seguinte."
    />
    {isAdministrator
      ? <CustomerGroupsWorkspace />
      : <EmptyState icon={Lock} title="Acesso restrito" description="Somente o administrador cadastra grupos de clientes." />}
  </PortalLayout>
}

function CustomerGroupsWorkspace() {
  const feedback = useFeedback()
  const listId = useId()
  const [networks, setNetworks] = useState<{ id: string; name: string }[]>([])
  const [networkId, setNetworkId] = useState('')
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [membersOf, setMembersOf] = useState<CustomerGroup | null>(null)
  const [documents, setDocuments] = useState('')
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchNetworks()
      .then(list => {
        if (cancelled) return
        const active = list.filter(network => network.isActive).map(network => ({ id: network.id, name: network.name }))
        setNetworks(active)
        setNetworkId(current => current && active.some(network => network.id === current) ? current : active[0]?.id ?? '')
      })
      .catch(() => { if (!cancelled) setPhase('error') })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!networkId) return
    let cancelled = false
    setPhase('loading')
    fetchCustomerGroups(networkId)
      .then(list => { if (!cancelled) { setGroups(list); setPhase('ready') } })
      .catch(() => { if (!cancelled) setPhase('error') })
    return () => { cancelled = true }
  }, [networkId, attempt])

  async function createGroup(event: FormEvent) {
    event.preventDefault()
    if (!networkId || pending) return
    setPending(true)
    setFormError('')
    try {
      await createCustomerGroup(networkId, name.trim())
      setCreating(false)
      setName('')
      setAttempt(current => current + 1)
      feedback.success({ title: 'Grupo criado.' })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível gravar o grupo.')
    } finally {
      setPending(false)
    }
  }

  async function saveMembers(event: FormEvent) {
    event.preventDefault()
    if (!membersOf || pending) return
    const parsed = parseCpfList(documents)
    if ('error' in parsed) {
      setFormError(parsed.error)
      return
    }
    setPending(true)
    setFormError('')
    try {
      await replaceCustomerGroupMembers(membersOf.id, parsed.documents)
      setMembersOf(null)
      setDocuments('')
      setAttempt(current => current + 1)
      feedback.success({ title: 'CPFs do grupo atualizados.' })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível gravar o grupo.')
    } finally {
      setPending(false)
    }
  }

  async function activate(group: CustomerGroup) {
    setPending(true)
    try {
      await activateCustomerGroup(group.id, group.name)
      setAttempt(current => current + 1)
      feedback.success({ title: 'Grupo ativado.' })
    } catch (error) {
      feedback.error({ title: 'Não foi possível ativar o grupo.', description: error instanceof Error ? error.message : undefined })
    } finally {
      setPending(false)
    }
  }

  async function inactivate(group: CustomerGroup) {
    setPending(true)
    try {
      await inactivateCustomerGroup(group.id)
      setAttempt(current => current + 1)
      feedback.success({ title: 'Grupo inativado.' })
    } catch (error) {
      feedback.error({ title: 'Não foi possível inativar o grupo.', description: error instanceof Error ? error.message : undefined })
    } finally {
      setPending(false)
    }
  }

  return <section className="customer-groups">
    <div className="customer-groups-toolbar">
      <Select
        label="Rede"
        options={networks.map(network => ({ value: network.id, label: network.name }))}
        selectedKey={networkId}
        onSelectionChange={key => setNetworkId(String(key ?? ''))}
        placeholder="Escolha a rede"
      />
      <Button onPress={() => { setCreating(true); setFormError(''); setName('') }} isDisabled={!networkId}>Novo grupo</Button>
    </div>
    {phase === 'loading' && <Loading message="Carregando grupos…" />}
    {phase === 'error' && <EmptyState icon={Users} title="Não foi possível carregar os grupos" action={<Button variant="secondary" onPress={() => setAttempt(current => current + 1)}>Tentar novamente</Button>} />}
    {phase === 'ready' && groups.length === 0 && <EmptyState icon={Users} title="Nenhum grupo nesta rede" description="Crie um grupo e cole os CPFs." />}
    {phase === 'ready' && groups.length > 0 && <ul className="customer-groups-list" aria-label="Grupos">
      {groups.map(group => <li key={group.id}>
        <div>
          <strong>{group.name}</strong>
          <span>{group.isActive ? 'Ativo' : 'Inativo'} · {group.memberCount} CPFs</span>
        </div>
        <div className="customer-groups-actions">
          <Button size="sm" variant="secondary" onPress={() => { setMembersOf(group); setDocuments(''); setFormError('') }}>CPFs</Button>
          {group.isActive
            ? <Button size="sm" variant="secondary" isDisabled={pending} onPress={() => void inactivate(group)}>Inativar</Button>
            : <Button size="sm" variant="secondary" isDisabled={pending} onPress={() => void activate(group)}>Ativar</Button>}
        </div>
      </li>)}
    </ul>}

    <Modal
      isOpen={creating}
      onOpenChange={open => { if (!open && !pending) setCreating(false) }}
      title="Novo grupo"
      secondaryAction={{ label: 'Cancelar', isDisabled: pending, onPress: () => setCreating(false) }}
      primaryAction={{ label: 'Cadastrar', type: 'submit', form: 'customer-group-create', isPending: pending }}
    >
      <form id="customer-group-create" className="customer-groups-form" onSubmit={event => void createGroup(event)}>
        {formError && <FeedbackAlert type="error" title="Não foi possível salvar." description={formError} />}
        <Input label="Nome" value={name} onChange={setName} isRequired autoFocus />
      </form>
    </Modal>

    <Modal
      isOpen={membersOf !== null}
      onOpenChange={open => { if (!open && !pending) setMembersOf(null) }}
      title={membersOf ? `CPFs de ${membersOf.name}` : 'CPFs'}
      secondaryAction={{ label: 'Cancelar', isDisabled: pending, onPress: () => setMembersOf(null) }}
      primaryAction={{ label: 'Salvar lista', type: 'submit', form: 'customer-group-members', isPending: pending }}
    >
      <form id="customer-group-members" className="customer-groups-form" onSubmit={event => void saveMembers(event)}>
        {formError && <FeedbackAlert type="error" title="Não foi possível salvar." description={formError} />}
        <label htmlFor={listId}>Lista</label>
        <textarea id={listId} value={documents} onChange={event => setDocuments(event.target.value)} rows={8} placeholder={'Um CPF por linha'} />
        <p>A lista substitui a anterior. Até 10.000 CPFs. Nada fica gravado neste navegador.</p>
      </form>
    </Modal>
  </section>
}
