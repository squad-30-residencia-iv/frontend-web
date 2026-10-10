import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FeedbackProvider } from './components/ui/FeedbackProvider'
import { ComponentsDemoPage } from './pages/ComponentsDemoPage'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><ComponentsDemoPage /><FeedbackProvider /></StrictMode>,
)
