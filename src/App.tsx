import { useSyncExternalStore } from 'react'
import { LoginPage } from './pages/LoginPage'
import { CampaignManagementPage } from './pages/CampaignManagementPage'
import { CreateCampaignPage } from './pages/CreateCampaignPage'

function subscribeToPathname(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}
function getPathname() {
  return window.location.pathname.replace(/\/$/, '')
}
export function App() {
  const pathname = useSyncExternalStore(subscribeToPathname, getPathname)
  if (pathname === '/campanhas/nova') return <CreateCampaignPage />
  if (pathname === '/campanhas') return <CampaignManagementPage />
  return <LoginPage />
}
