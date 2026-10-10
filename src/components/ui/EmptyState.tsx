import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import './EmptyState.css'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      <Icon size={36} aria-hidden="true" />
      <h3 className="ui-empty-state-title">{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
