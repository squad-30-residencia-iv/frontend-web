import { VoucherLookupPage, VoucherHistoryPending } from './pages/VoucherLookupPage'
import { useSyncExternalStore } from 'react'
import { LoginPage } from './pages/LoginPage'
import { CampaignManagementPage } from './pages/CampaignManagementPage'
import { CreateCampaignPage } from './pages/CreateCampaignPage'
import { HomePage } from './pages/HomePage'
import { SectionPlaceholderPage, type PlaceholderSection } from './pages/SectionPlaceholderPage'
import { CampaignDetailsPage } from './pages/CampaignDetailsPage'

const campaignDetailsPattern = /^\/campanhas\/([^/]+)$/

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}



const placeholderRoutes: Record<string, PlaceholderSection> = {
  '/relatorios': 'reports',
  '/auditoria': 'audit',
}

function subscribeToPathname(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}
function getPathname() {
  return window.location.pathname.replace(/\/$/, '')
}
export function App() {
  const pathname = useSyncExternalStore(subscribeToPathname, getPathname)
  if (pathname === '/vouchers') return <VoucherLookupPage />
  if (/^\/vouchers\/[^/]+\/historico$/.test(pathname)) return <VoucherHistoryPending />
  if (pathname === '/home') return <HomePage />
  if (pathname === '/campanhas/nova') return <CreateCampaignPage />
  if (pathname === '/campanhas') return <CampaignManagementPage />
  const campaignDetailsMatch = campaignDetailsPattern.exec(pathname)
  if (campaignDetailsMatch) return <CampaignDetailsPage campaignId={safeDecode(campaignDetailsMatch[1])} />
  if (pathname in placeholderRoutes) return <SectionPlaceholderPage section={placeholderRoutes[pathname]} />
  return <LoginPage />
}
