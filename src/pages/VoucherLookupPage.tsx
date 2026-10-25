import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BadgeCheck, ChevronLeft, ChevronRight, CircleX, Clock, Search, Ticket, TriangleAlert } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { PageHeader } from '../components/shared/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { VoucherActionsMenu } from '../components/vouchers/VoucherActionsMenu'
import { emptyVoucherFilters, filterVouchers, loadVouchers, voucherStatusLabels } from '../data/vouchers'
import type { Voucher, VoucherFilters } from '../types/voucher'
import { navigate } from '../navigation/navigate'
import './VoucherLookupPage.css'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'success'; items: readonly Voucher[] }
export interface VoucherLookupPageProps { loadItems?: () => Promise<readonly Voucher[]> }
const numberFormat = new Intl.NumberFormat('pt-BR')
const formatDate = (value: string) => value.split('-').reverse().join('/')
const pageSize = 7
const summary = [
  { status: 'available', label: 'Disponíveis', icon: Ticket },
  { status: 'used', label: 'Utilizados', icon: BadgeCheck },
  { status: 'expired', label: 'Expirados', icon: Clock },
  { status: 'cancelled', label: 'Cancelados', icon: CircleX },
] as const

export function VoucherLookupPage({ loadItems = loadVouchers }: VoucherLookupPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(loadItems).then(items => {
      if (!cancelled) setState({ status: 'success', items })
    }).catch(() => {
      if (!cancelled) setState({ status: 'error' })
    })
    return () => { cancelled = true }
  }, [loadItems, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt(value => value + 1)
  }

  return <PortalLayout activeSection="vouchers">
    <div className="voucher-page" aria-busy={state.status === 'loading'}>
      <PageHeader
        title="Consulta de Vouchers"
        subtitle="Consulte os vouchers emitidos e acompanhe seus respectivos status e movimentações"
        breadcrumbs={[{ label: 'Portal' }, { label: 'Vouchers' }]}
      />
      {state.status === 'loading' && <Loading message="Carregando vouchers…" />}
      {state.status === 'error' && <div role="alert">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível carregar os vouchers"
          description="Tente carregar os dados novamente."
          action={<Button variant="secondary" onPress={retry}>Tentar novamente</Button>}
        />
      </div>}
      {state.status === 'success' && <VoucherContent items={state.items} />}
    </div>
  </PortalLayout>
}

function VoucherContent({ items }: { items: readonly Voucher[] }) {
  const [filters, setFilters] = useState<VoucherFilters>(emptyVoucherFilters)
  const [applied, setApplied] = useState<VoucherFilters>(emptyVoucherFilters)
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => filterVouchers(items, applied), [items, applied])
  const pageCount = Math.ceil(filtered.length / pageSize)
  const currentPage = Math.min(page, Math.max(1, pageCount))
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pages = [...new Set([1, 2, 3, currentPage - 1, currentPage, currentPage + 1, pageCount])]
    .filter(value => value > 0 && value <= pageCount).sort((a, b) => a - b)
  const campaigns = useMemo(() => [...new Map(items.map(voucher => [voucher.campaignId, {
    value: voucher.campaignId, label: voucher.campaignName,
  }])).values()], [items])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApplied({ ...filters })
    setPage(1)
  }

  function clearFilters() {
    setFilters(emptyVoucherFilters)
    setApplied(emptyVoucherFilters)
    setPage(1)
  }

  function updateFilter(field: keyof VoucherFilters, value: string) {
    setFilters(current => ({ ...current, [field]: value }))
  }

  return <>
    <section className="voucher-summary" aria-label="Resumo de vouchers">
      {summary.map(({ status, label, icon: Icon }) => <article key={status} className={`voucher-summary-card voucher-tone-${status}`}>
        <div><h2>{label}</h2><span className="voucher-summary-icon"><Icon size={18} aria-hidden="true" /></span></div>
        <strong>{numberFormat.format(items.filter(voucher => voucher.status === status).length)}</strong>
      </article>)}
    </section>
    <form className="voucher-filters" aria-label="Filtros de vouchers" onSubmit={applyFilters}>
      <Input
        className="voucher-search"
        label="Buscar por código ou cliente"
        placeholder="Buscar por código ou cliente..."
        icon={Search}
        value={filters.search}
        onChange={value => updateFilter('search', value)}
      />
      <Select className="voucher-filter" label="Campanha:" options={[{ value: 'all', label: 'Todos' }, ...campaigns]}
        value={filters.campaign} onChange={value => updateFilter('campaign', String(value))} />
      <Select className="voucher-filter" label="Status:" options={[
        { value: 'all', label: 'Todos' },
        ...Object.entries(voucherStatusLabels).map(([value, label]) => ({ value, label })),
      ]} value={filters.status} onChange={value => updateFilter('status', String(value))} />
      <Select className="voucher-filter" label="Período de emissão:" options={[
        { value: 'all', label: 'Todos' }, { value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' },
      ]} value={filters.period} onChange={value => updateFilter('period', String(value))} />
      <Button type="submit" className="voucher-filter-button">Filtrar</Button>
      <Button type="button" variant="ghost" className="voucher-clear" onPress={clearFilters}>Limpar filtros</Button>
    </form>
    <section className="voucher-list" aria-label="Vouchers emitidos">
      {visible.length === 0 ? <EmptyState
        title="Nenhum voucher encontrado"
        description={items.length ? 'Tente outro código, cliente ou combinação de filtros.' : 'Ainda não há vouchers emitidos.'}
        action={items.length > 0 ? <Button variant="secondary" onPress={clearFilters}>Limpar filtros</Button> : undefined}
      /> : <>
        <div className="voucher-table-scroll" tabIndex={0} role="region" aria-label="Tabela de vouchers com rolagem horizontal">
          <table className="voucher-table">
            <caption className="voucher-sr-only">Consulta de vouchers emitidos</caption>
            <thead><tr>{['Código', 'Campanha de origem', 'Cliente', 'Data de emissão', 'Validade', 'Usos', 'Status', 'Ações'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{visible.map(voucher => <tr key={voucher.id}>
              <th scope="row">{voucher.code}</th>
              <td className="voucher-campaign-name">{voucher.campaignName}</td>
              <td>{voucher.clientIdentification}</td>
              <td className="voucher-date">{formatDate(voucher.issuedAt)}</td>
              <td className="voucher-date">{formatDate(voucher.expiresAt)}</td>
              <td>{voucher.uses}/{voucher.usageLimit}</td>
              <td><span className={`voucher-status voucher-tone-${voucher.status}`}><span aria-hidden="true">● </span>{voucherStatusLabels[voucher.status]}</span></td>
              <td><VoucherActionsMenu voucher={voucher} /></td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
      <footer className="voucher-list-footer">
        <p role="status">Exibindo <strong>{visible.length}</strong> de <strong>{numberFormat.format(filtered.length)}</strong> vouchers</p>
        {pageCount > 1 && <nav aria-label="Paginação de vouchers">
          <Button isIconOnly variant="secondary" aria-label="Página anterior" startIcon={ChevronLeft} isDisabled={currentPage === 1} onPress={() => setPage(currentPage - 1)} />
          {pages.map((value, index) => <span className="voucher-page-item" key={value}>
            {index > 0 && value - pages[index - 1] > 1 && <span aria-hidden="true">...</span>}
            <Button aria-label={`Página ${value}`} aria-current={value === currentPage ? 'page' : undefined}
              variant={value === currentPage ? 'primary' : 'secondary'} onPress={() => setPage(value)}>{value}</Button>
          </span>)}
          <Button isIconOnly variant="secondary" aria-label="Próxima página" startIcon={ChevronRight} isDisabled={currentPage === pageCount} onPress={() => setPage(currentPage + 1)} />
        </nav>}
      </footer>
    </section>
  </>
}

// Apenas um destino provisório; não implementa a tela de histórico.
export function VoucherHistoryPending() {
  return <PortalLayout activeSection="vouchers">
    <PageHeader title="Histórico do voucher" breadcrumbs={[{ label: 'Portal' }, { label: 'Vouchers', href: '/vouchers' }, { label: 'Histórico' }]} />
    <EmptyState
      title="Histórico ainda não disponível"
      description="A consulta de movimentações será implementada em uma próxima etapa."
      action={<Button variant="secondary" onPress={() => navigate('/vouchers')}>Voltar para vouchers</Button>}
    />
  </PortalLayout>
}
