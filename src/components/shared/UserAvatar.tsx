import { UserRound } from 'lucide-react'
import './UserAvatar.css'

export interface UserAvatarProps {
  /** URL da foto de perfil. Sem ela, mostra o ícone de usuário. */
  src?: string
  size?: 'md' | 'lg'
}

const iconSizes = { md: 20, lg: 28 }

// Decorativo: o nome do usuário sempre aparece em texto ao lado do avatar.
export function UserAvatar({ src, size = 'md' }: UserAvatarProps) {
  return (
    <span className={`user-avatar user-avatar--${size}`}>
      {src
        ? <img className="user-avatar-image" src={src} alt="" />
        : <UserRound size={iconSizes[size]} aria-hidden="true" />}
    </span>
  )
}
