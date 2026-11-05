import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { FeedbackProvider } from './components/ui/FeedbackProvider'
import { AuthProvider } from './contexts/AuthContext'
import { enableMocking } from './mocks/enableMocking'
import './styles.css'

enableMocking().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
        <FeedbackProvider />
      </AuthProvider>
    </StrictMode>,
  )
})
