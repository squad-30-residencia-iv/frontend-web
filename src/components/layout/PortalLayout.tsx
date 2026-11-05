import { type MouseEvent, type ReactNode } from 'react'
import { LogOut, Ticket } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { currentUser } from '../../data/currentUser'
import { navigate } from '../../navigation/navigate'
import { UserAvatar } from '../shared/UserAvatar'
import {
  homePath,
  portalNavigation,
  resolveActiveSection,
  type PortalSection,
} from './navigation'
import './PortalLayout.css'

interface PortalLayoutProps {
  children: ReactNode
  /** Item destacado da Sidebar. Sem ele, é deduzido pelo pathname. */
  activeSection?: PortalSection
  /**
   * Intercepta a navegação da Sidebar (ex.: confirmar descarte de alterações).
   * Quando informado, a tela decide se e quando chamar navigate().
   */
  onNavigate?: (path: string) => void
}

function formatRole(role: string): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'analyst') return 'Analista de Campanhas'
  return role
}

export function PortalLayout({ children, activeSection, onNavigate }: PortalLayoutProps) {
  const current = activeSection ?? resolveActiveSection(window.location.pathname)
  const { user, isAuthenticated, logout } = useAuth()

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>, path: string) {
    // Ctrl/Cmd/Shift/Alt e botão do meio mantêm o comportamento nativo (nova aba/janela).
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    if (onNavigate) onNavigate(path)
    else if (window.location.pathname !== path) navigate(path)
  }

  const displayName = user?.name ?? currentUser.name
  const displayRole = user ? formatRole(user.role) : currentUser.role
  const avatarUrl = user ? undefined : currentUser.avatarUrl

  function handleLogout() {
    logout()
  }

  return (
    <div className="portal-layout">
      <aside className="portal-sidebar" aria-label="Navegação do portal">
        <a
          href={homePath}
          className="portal-brand"
          onClick={(event) => handleLinkClick(event, homePath)}
        >
          <span className="portal-brand-icon">
            <Ticket size={18} />
          </span>
          <span>
            <strong>Portal Campanhas</strong>
            <small>Retail Management</small>
          </span>
        </a>
        <nav aria-label="Principal">
          {portalNavigation.map(({ id, label, path, icon: Icon }) => (
            <a
              key={id}
              href={path}
              aria-current={id === current ? 'page' : undefined}
              onClick={(event) => handleLinkClick(event, path)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="portal-profile">
          <UserAvatar src={avatarUrl} />
          <div className="portal-profile-info">
            <strong>{displayName}</strong>
            <small>{displayRole}</small>
          </div>
          {isAuthenticated && (
            <button
              type="button"
              className="portal-logout-button"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair da conta"
            >
              <LogOut size={15} aria-hidden="true" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>
      <main className="portal-main">{children}</main>
    </div>
  )
}
