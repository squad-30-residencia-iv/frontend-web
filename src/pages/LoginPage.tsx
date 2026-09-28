import { useState, type FormEvent } from 'react'
import { Brand } from '../components/login/Brand'
import { CampaignIllustration } from '../components/login/CampaignIllustration'
import './LoginPage.css'

export interface LoginCredentials {
  email: string
  password: string
}

export function LoginPage() {
  const [feedback, setFeedback] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('A autenticação ainda não está conectada. Entre em contato com o administrador do sistema.')
  }

  return (
    <main className="login-page">
      <section aria-label="Portal Campanhas" className="login-hero">
        <div className="login-hero-background" />
        <Brand />
        <div className="login-hero-content">
          <h1 className="login-hero-title">
            Campanhas<br />que geram<br /><span className="login-hero-highlight">resultados.</span>
          </h1>
        </div>
        <CampaignIllustration />
      </section>

      <section aria-labelledby="login-title" className="login-section">
        <div className="login-card">
          <h2 id="login-title" className="login-title">
            Bem-vindo de volta!
          </h2>
          <p className="login-subtitle">
            Acesse sua conta para continuar
          </p>

          <form
            onSubmit={handleSubmit}
            onInput={() => setFeedback('')}
            className="login-form"
          >
            <label htmlFor="email" className="login-label">
              E-mail corporativo:
            </label>
            <div className="login-field">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nome@email.com"
                required
                className="login-input"
              />
            </div>
            <label htmlFor="password" className="login-label login-label--password">
              Senha:
            </label>
            <div className="login-field">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                required
                className="login-input"
              />
              <button type="submit" className="login-button">
                Entrar
              </button>
            </div>
            <p role="status" className="login-feedback">
              {feedback}
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
