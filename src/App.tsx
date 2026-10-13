import { LoginPage } from './pages/LoginPage'
import { CampaignManagementPage } from './pages/CampaignManagementPage'
export function App() {
  return window.location.pathname.replace(/\/$/, '') === '/campanhas' ? <CampaignManagementPage /> : <LoginPage />
}
