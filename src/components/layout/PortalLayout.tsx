import type { ReactNode } from 'react'
import { Ticket, LayoutGrid, Megaphone, ChartNoAxesColumn, ShieldCheck, UserRound } from 'lucide-react'
import { useFeedback } from '../ui/useFeedback'
import './PortalLayout.css'

const navigation = [
  { label: 'Visão geral', icon: LayoutGrid }, { label: 'Campanhas', icon: Megaphone },
  { label: 'Vouchers', icon: Ticket }, { label: 'Relatórios', icon: ChartNoAxesColumn }, { label: 'Auditoria', icon: ShieldCheck },
]
export function PortalLayout({ children }: { children: ReactNode }) {
  const feedback = useFeedback()
  return <div className="portal-layout">
    <aside className="portal-sidebar" aria-label="Navegação do portal">
      <a href="/campanhas" className="portal-brand"><span className="portal-brand-icon"><Ticket size={18} /></span><span><strong>Portal Campanhas</strong><small>Retail Management</small></span></a>
      <nav aria-label="Principal">{navigation.map(({ label, icon: Icon }) => <a key={label} href={label === 'Campanhas' ? '/campanhas' : '#'} aria-current={label === 'Campanhas' ? 'page' : undefined} onClick={label === 'Campanhas' ? undefined : event => { event.preventDefault(); feedback.info({ title: `${label} estará disponível em uma próxima etapa.` }) }}><Icon size={17} /><span>{label}</span></a>)}</nav>
      <div className="portal-profile"><span className="portal-avatar"><UserRound size={20} /></span><span><strong>Lucas Silva</strong><small>Gestor de Marketing</small></span></div>
    </aside>
    <main className="portal-main">{children}</main>
  </div>
}
