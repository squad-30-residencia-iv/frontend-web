import { useSyncExternalStore } from 'react'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { AuditOperationDetailsPage } from './pages/AuditOperationDetailsPage'
import { AuditPage } from './pages/AuditPage'
import { CampaignDetailsPage } from './pages/CampaignDetailsPage'
import { CampaignManagementPage } from './pages/CampaignManagementPage'
import { CreateCampaignPage } from './pages/CreateCampaignPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegistryPage } from './pages/RegistryPage'
import { ReportsPage } from './pages/ReportsPage'
import { SectionPlaceholderPage, type PlaceholderSection } from './pages/SectionPlaceholderPage'
import { VoucherHistoryPending, VoucherLookupPage } from './pages/VoucherLookupPage'
import { useAuth } from './contexts/AuthContext'
import { sessionCampaignRole } from './data/campaignWorkflow'
import { applicationsPath, registryPath } from './components/layout/navigation'

const campaignDetailsPattern = /^\/campanhas\/([^/]+)$/
const campaignEditPattern = /^\/campanhas\/([^/]+)\/editar$/

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const placeholderRoutes: Record<string, PlaceholderSection> = {}

function subscribeToPathname(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

function getPathname() {
  return window.location.pathname.replace(/\/$/, '')
}

function CampaignDetailsRoute({ campaignId }: { campaignId: string }) {
  const { user } = useAuth()
  return <CampaignDetailsPage campaignId={campaignId} actorRole={user ? sessionCampaignRole(user.role) : undefined} />
}

export function App() {
  const pathname = useSyncExternalStore(subscribeToPathname, getPathname)

  if (pathname === applicationsPath) {
    return (
      <ProtectedRoute allowedRoles={['administrador']}>
        <ApplicationsPage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/auditoria') {
    return (
      <ProtectedRoute>
        <AuditPage />
      </ProtectedRoute>
    )
  }

  const auditOperationMatch = /^\/auditoria\/([^/]+)$/.exec(pathname)
  if (auditOperationMatch) {
    return (
      <ProtectedRoute>
        <AuditOperationDetailsPage
          key={auditOperationMatch[1]}
          operationId={safeDecode(auditOperationMatch[1])}
        />
      </ProtectedRoute>
    )
  }

  if (pathname === '/vouchers') {
    return (
      <ProtectedRoute>
        <VoucherLookupPage />
      </ProtectedRoute>
    )
  }

  if (/^\/vouchers\/[^/]+\/historico$/.test(pathname)) {
    return (
      <ProtectedRoute>
        <VoucherHistoryPending />
      </ProtectedRoute>
    )
  }

  if (pathname === '/home') {
    return (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/relatorios') {
    return (
      <ProtectedRoute>
        <ReportsPage />
      </ProtectedRoute>
    )
  }

  // A tela mostra "Acesso restrito" a quem não é administrador, dentro do layout do portal.
  if (pathname === registryPath) {
    return (
      <ProtectedRoute>
        <RegistryPage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/campanhas/nova') {
    return (
      <ProtectedRoute>
        <CreateCampaignPage />
      </ProtectedRoute>
    )
  }

  if (pathname === '/campanhas') {
    return (
      <ProtectedRoute>
        <CampaignManagementPage />
      </ProtectedRoute>
    )
  }

  const campaignEditMatch = campaignEditPattern.exec(pathname)
  if (campaignEditMatch) {
    return (
      <ProtectedRoute>
        <CreateCampaignPage key={campaignEditMatch[1]} campaignId={safeDecode(campaignEditMatch[1])} />
      </ProtectedRoute>
    )
  }

  const campaignDetailsMatch = campaignDetailsPattern.exec(pathname)
  if (campaignDetailsMatch) {
    return (
      <ProtectedRoute>
        <CampaignDetailsRoute campaignId={safeDecode(campaignDetailsMatch[1])} />
      </ProtectedRoute>
    )
  }

  if (pathname in placeholderRoutes) {
    return (
      <ProtectedRoute>
        <SectionPlaceholderPage section={placeholderRoutes[pathname]} />
      </ProtectedRoute>
    )
  }

  return <LoginPage />
}
