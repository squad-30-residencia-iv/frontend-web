import { ChartNoAxesColumn, LayoutGrid, Megaphone, MonitorSmartphone, ShieldCheck, Ticket, type LucideIcon } from 'lucide-react'
import type { UserRole } from '../../services/auth.types'

export type PortalSection = 'home' | 'campaigns' | 'vouchers' | 'reports' | 'audit' | 'applications'

export interface PortalNavigationItem {
  id: PortalSection
  label: string
  path: string
  icon: LucideIcon
  /** Quando informado, o item só aparece para o perfil indicado. */
  requiredRole?: UserRole
}

export const homePath = '/home'

export const portalNavigation: readonly PortalNavigationItem[] = [
  { id: 'home', label: 'Visão geral', path: homePath, icon: LayoutGrid },
  { id: 'campaigns', label: 'Campanhas', path: '/campanhas', icon: Megaphone },
  { id: 'vouchers', label: 'Vouchers', path: '/vouchers', icon: Ticket },
  { id: 'reports', label: 'Relatórios', path: '/relatorios', icon: ChartNoAxesColumn },
  { id: 'audit', label: 'Auditoria', path: '/auditoria', icon: ShieldCheck },
  { id: 'applications', label: 'Aplicações', path: '/aplicacoes', icon: MonitorSmartphone, requiredRole: 'admin' },
]

/** Filtra os itens de navegação conforme o perfil do usuário. */
export function getVisibleNavigation(role?: UserRole): readonly PortalNavigationItem[] {
  if (!role) return portalNavigation.filter(item => !item.requiredRole)
  return portalNavigation.filter(item => !item.requiredRole || item.requiredRole === role)
}

// Descobre o item ativo pelo pathname. "/" e rotas desconhecidas contam como Visão geral.
export function resolveActiveSection(pathname: string): PortalSection {
  const normalized = pathname.replace(/\/$/, '')
  const match = portalNavigation.find(item => normalized === item.path || normalized.startsWith(`${item.path}/`))
  return match?.id ?? 'home'
}
