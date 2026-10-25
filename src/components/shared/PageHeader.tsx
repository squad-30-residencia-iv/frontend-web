import type { MouseEvent, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { navigate } from '../../navigation/navigate'
import './PageHeader.css'

export interface PageBreadcrumb {
  label: string
  href?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export interface PageHeaderProps {
  title: string
  breadcrumbs: readonly PageBreadcrumb[]
  action?: ReactNode
  titleId?: string
  subtitle?: string
}

// As páginas definem seu caminho e ação; a Home mantém o HomeGreeting exclusivo.
export function PageHeader({ title, breadcrumbs, action, titleId, subtitle }: PageHeaderProps) {
  function handleLink(event: MouseEvent<HTMLAnchorElement>, item: PageBreadcrumb) {
    item.onClick?.(event)
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    if (item.href) {
      event.preventDefault()
      navigate(item.href)
    }
  }

  return <header className="page-header">
    <div className="page-header-content">
      <nav aria-label="Caminho" className="page-header-breadcrumb">
        <ol>
          {breadcrumbs.map((item, index) => {
            const current = index === breadcrumbs.length - 1
            return <li key={`${item.label}-${index}`}>
              {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
              {item.href && !current
                ? <a href={item.href} onClick={event => handleLink(event, item)}>{item.label}</a>
                : <span aria-current={current ? 'page' : undefined}>{item.label}</span>}
            </li>
          })}
        </ol>
      </nav>
      <h1 id={titleId}>{title}</h1>
      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
    </div>
    {action != null && action !== false && <div className="page-header-action">{action}</div>}
  </header>
}
