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
import { ReportsPage } from './pages/ReportsPage'
import { SectionPlaceholderPage, type PlaceholderSection } from './pages/SectionPlaceholderPage'
import { VoucherHistoryPending, VoucherLookupPage } from './pages/VoucherLookupPage'

const campaignDetailsPattern = /^\/campanhas\/([^/]+)$/

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

export function App() {
  const pathname = useSyncExternalStore(subscribeToPathname, getPathname)

  if (pathname === '/aplicacoes') {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
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

  const campaignDetailsMatch = campaignDetailsPattern.exec(pathname)
  if (campaignDetailsMatch) {
    return (
      <ProtectedRoute>
        <CampaignDetailsPage
          campaignId={safeDecode(campaignDetailsMatch[1])}
        />
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
