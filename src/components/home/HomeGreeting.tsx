import type { PortalUser } from '../../types/user'
import { UserAvatar } from '../shared/UserAvatar'
import './HomeGreeting.css'

export interface HomeGreetingProps {
  user: PortalUser
}

// Cabeçalho exclusivo da Home. Não é o PageHeader das páginas internas.
export function HomeGreeting({ user }: HomeGreetingProps) {
  const firstName = user.name.trim().split(/\s+/)[0]

  return (
    <header className="home-greeting">
      <UserAvatar src={user.avatarUrl} size="lg" />
      <div>
        <h1 className="home-greeting-title">Olá, {firstName}!</h1>
        <p className="home-greeting-subtitle">Bem-vindo de volta! Acompanhe suas campanhas e a utilização dos vouchers.</p>
      </div>
    </header>
  )
}
