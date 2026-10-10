import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center text-muted">
      <Icon size={36} aria-hidden="true" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
