import { ChartNoAxesColumn, Database, LayoutGrid, Megaphone, ShieldCheck, Ticket, type LucideIcon } from 'lucide-react'
import type { UserRole } from '../../services/auth.types'

export type PortalSection = 'home' | 'campaigns' | 'vouchers' | 'reports' | 'audit' | 'registry'

export interface PortalNavigationItem {
  id: PortalSection
  label: string
  path: string
  icon: LucideIcon
  /** Papéis que veem o item. Sem a lista, todos veem. */
  roles?: readonly UserRole[]
}

export const homePath = '/home'
export const registryPath = '/cadastros'

export const portalNavigation: readonly PortalNavigationItem[] = [
  { id: 'home', label: 'Visão geral', path: homePath, icon: LayoutGrid },
  { id: 'campaigns', label: 'Campanhas', path: '/campanhas', icon: Megaphone },
  { id: 'vouchers', label: 'Vouchers', path: '/vouchers', icon: Ticket },
  { id: 'reports', label: 'Relatórios', path: '/relatorios', icon: ChartNoAxesColumn },
  { id: 'audit', label: 'Auditoria', path: '/auditoria', icon: ShieldCheck },
  { id: 'registry', label: 'Cadastros', path: registryPath, icon: Database, roles: ['administrador'] },
]

/** Itens que o papel da sessão vê. Sem sessão, só os itens abertos a todos. */
export function visibleNavigation(role: UserRole | null): PortalNavigationItem[] {
  return portalNavigation.filter(item => !item.roles || (role !== null && item.roles.includes(role)))
}

// Descobre o item ativo pelo pathname. "/" e rotas desconhecidas contam como Visão geral.
export function resolveActiveSection(pathname: string): PortalSection {
  const normalized = pathname.replace(/\/$/, '')
  const match = portalNavigation.find(item => normalized === item.path || normalized.startsWith(`${item.path}/`))
  return match?.id ?? 'home'
}
