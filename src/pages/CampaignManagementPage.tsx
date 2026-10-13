import { useState } from 'react'
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Pause, Play, Plus, Search, ShieldAlert } from 'lucide-react'
import { PortalLayout } from '../components/layout/PortalLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { useFeedback } from '../components/ui/useFeedback'
import { CampaignActionsMenu } from '../components/campaigns/CampaignActionsMenu'
import { campaigns as mockCampaigns } from '../data/campaigns'
import { statusLabels, type Campaign } from '../types/campaign'
import './CampaignManagementPage.css'

const numberFormat = new Intl.NumberFormat('pt-BR')
const dateFormat = (date: string) => date.split('-').reverse().join('/')
const metrics = [
  { label: 'Campanhas Ativas', value: 24, change: '+4.8%', icon: Play, tone: 'active' },
  { label: 'Agendadas', value: 8, change: '+1.2%', icon: CalendarDays, tone: 'scheduled' },
  { label: 'Pausadas', value: 3, change: '-2.4%', icon: Pause, tone: 'paused' },
  { label: 'Encerradas', value: 45, change: '+12.5%', icon: CheckSquare, tone: 'ended' },
]
const statusOptions = [{ value: 'all', label: 'Todos os status' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]
const periodOptions = [{ value: 'all', label: 'Todos os períodos' }, { value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' }]
const pageSize = 7
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export interface CampaignManagementPageProps { campaigns?: readonly Campaign[]; isLoading?: boolean }
export function CampaignManagementPage({ campaigns = mockCampaigns, isLoading = false }: CampaignManagementPageProps) {
  const feedback = useFeedback()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approved, setApproved] = useState(false)
  const filtered = campaigns.filter(campaign => normalize(campaign.name).includes(normalize(search)) && (status === 'all' || campaign.status === status) && (period === 'all' || (campaign.start <= '2024-11-30' && campaign.end >= (period === '30' ? '2024-11-01' : '2024-09-02'))))
  const pageCount = Math.ceil(filtered.length / pageSize)
  const currentPage = Math.min(page, Math.max(1, pageCount))
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageNumbers = [...new Set([1, 2, 3, currentPage - 1, currentPage, currentPage + 1, pageCount])].filter(value => value > 0 && value <= pageCount).sort((a, b) => a - b)
  function handleCreateCampaign() { feedback.info({ title: 'A criação de campanhas será implementada na próxima etapa.' }) }
  return <PortalLayout>
    <header className="campaign-header"><div><nav aria-label="Caminho" className="campaign-breadcrumb"><span>Portal</span><ChevronRight size={12} /><span>Campanhas</span></nav><h1>Gerenciamento de Campanhas</h1></div><Button className="campaign-create" startIcon={Plus} onPress={handleCreateCampaign}>Nova campanha</Button></header>
    {!approved && <section className="campaign-notice" aria-label="Campanha aguardando aprovação"><span className="campaign-notice-icon"><ShieldAlert size={17} /></span><div><strong>Nova campanha criada</strong><p>Uma nova campanha foi criada e aguarda sua aprovação.</p></div><Button className="campaign-approve" onPress={() => setApprovalOpen(true)}>Aprovar</Button></section>}
    <section className="campaign-metrics" aria-label="Resumo de campanhas">{metrics.map(({ label, value, change, icon: Icon, tone }) => <article className="campaign-metric" key={label}><div><h2>{label}</h2><span className={`campaign-metric-icon campaign-tone-${tone}`}><Icon size={19} /></span></div><div><strong>{value}</strong><span className={`campaign-change ${tone === 'paused' ? 'campaign-change-negative' : ''}`}>{change}</span></div></article>)}</section>
    <section className="campaign-filters" aria-label="Filtros de campanhas"><Input className="campaign-search" label="Buscar campanha" icon={Search} placeholder="Buscar campanha..." value={search} onChange={value => { setSearch(value); setPage(1) }} /><Select className="campaign-filter" label="Status:" options={statusOptions} value={status} onChange={value => { setStatus(String(value)); setPage(1) }} /><Select className="campaign-filter" label="Período:" options={periodOptions} value={period} onChange={value => { setPeriod(String(value)); setPage(1) }} />{period !== 'all' && <p className="campaign-period-note">Período de vigência com referência em 30/11/2024 (dados demonstrativos).</p>}</section>
    <section className="campaign-list" aria-label="Campanhas cadastradas" aria-busy={isLoading}>{isLoading ? <Loading message="Carregando campanhas…" /> : visible.length === 0 ? <EmptyState title="Nenhuma campanha encontrada" description="Tente outro nome, status ou período." action={<Button variant="secondary" onPress={() => { setSearch(''); setStatus('all'); setPeriod('all'); setPage(1) }}>Limpar filtros</Button>} /> : <>
      <div className="campaign-table-scroll"><table className="campaign-table"><caption className="campaign-sr-only">Listagem de campanhas</caption><thead><tr>{['Nome da campanha', 'Vigência', 'Escopo organizacional', 'Vouchers emitidos', 'Taxa de utilização', 'Status', 'Ações'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{visible.map(campaign => <tr key={campaign.id}><th scope="row">{campaign.name}</th><td className="campaign-date">{dateFormat(campaign.start).slice(0, 5)} a {dateFormat(campaign.end)}</td><td>{campaign.scope}</td><td>{numberFormat.format(campaign.vouchers)}</td><td><div className={`campaign-usage ${campaign.status === 'paused' ? 'campaign-usage-paused' : ''}`}><progress max={100} value={campaign.usage} aria-label={`Utilização de ${campaign.name}`} /><span>{campaign.usage}%</span></div></td><td><span className={`campaign-status campaign-tone-${campaign.status}`}>{statusLabels[campaign.status]}</span></td><td><CampaignActionsMenu campaign={campaign} /></td></tr>)}</tbody></table></div>
      <footer className="campaign-list-footer"><p aria-live="polite">Exibindo <strong>{visible.length}</strong> de <strong>{filtered.length}</strong> campanhas cadastradas</p><nav aria-label="Paginação de campanhas"><Button isIconOnly variant="secondary" aria-label="Página anterior" isDisabled={currentPage === 1} onPress={() => setPage(currentPage - 1)} startIcon={ChevronLeft} />{pageNumbers.map((value, index) => <span key={value} className="campaign-page-item">{index > 0 && value - pageNumbers[index - 1] > 1 && <span aria-hidden="true">...</span>}<Button aria-label={`Página ${value}`} aria-current={value === currentPage ? 'page' : undefined} variant={value === currentPage ? 'primary' : 'secondary'} onPress={() => setPage(value)}>{value}</Button></span>)}<Button isIconOnly variant="secondary" aria-label="Próxima página" isDisabled={currentPage === pageCount} onPress={() => setPage(currentPage + 1)} startIcon={ChevronRight} /></nav></footer>
    </>}</section>
    <ConfirmationModal action="approve" itemName="nova campanha" isOpen={approvalOpen} onOpenChange={setApprovalOpen} onConfirm={() => { setApproved(true); setApprovalOpen(false); feedback.success({ title: 'Campanha aprovada', description: 'A aprovação foi registrada localmente nesta demonstração.' }) }} />
  </PortalLayout>
}

