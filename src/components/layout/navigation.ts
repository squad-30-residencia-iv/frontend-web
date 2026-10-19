import { ChartNoAxesColumn, LayoutGrid, Megaphone, ShieldCheck, Ticket, type LucideIcon } from 'lucide-react'

export type PortalSection = 'home' | 'campaigns' | 'vouchers' | 'reports' | 'audit'

export interface PortalNavigationItem {
  id: PortalSection
  label: string
  path: string
  icon: LucideIcon
}

export const homePath = '/home'

export const portalNavigation: readonly PortalNavigationItem[] = [
  { id: 'home', label: 'Visão geral', path: homePath, icon: LayoutGrid },
  { id: 'campaigns', label: 'Campanhas', path: '/campanhas', icon: Megaphone },
  { id: 'vouchers', label: 'Vouchers', path: '/vouchers', icon: Ticket },
  { id: 'reports', label: 'Relatórios', path: '/relatorios', icon: ChartNoAxesColumn },
  { id: 'audit', label: 'Auditoria', path: '/auditoria', icon: ShieldCheck },
]

// Descobre o item ativo pelo pathname. "/" e rotas desconhecidas contam como Visão geral.
export function resolveActiveSection(pathname: string): PortalSection {
  const normalized = pathname.replace(/\/$/, '')
  const match = portalNavigation.find(item => normalized === item.path || normalized.startsWith(`${item.path}/`))
  return match?.id ?? 'home'
}
