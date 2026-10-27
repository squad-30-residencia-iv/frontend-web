import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageHeader } from './PageHeader'
import { App } from '../../App'

afterEach(() => { window.history.replaceState(null, '', '/'); vi.restoreAllMocks() })

describe('PageHeader global', () => {
  it('mostra caminho, título e executa a ação configurada de Auditoria', () => {
    const exportHistory = vi.fn()
    render(<PageHeader
      title="Auditoria"
      breadcrumbs={[{ label: 'Portal' }, { label: 'Auditoria' }]}
      action={<button onClick={exportHistory}>+ Exportar histórico</button>}
    />)
    expect(screen.getByRole('heading', { level: 1, name: 'Auditoria' })).toBeVisible()
    const path = screen.getByRole('navigation', { name: 'Caminho' })
    expect(within(path).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Portal', 'Auditoria'])
    expect(within(path).getByText('Auditoria')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: '+ Exportar histórico' }))
    expect(exportHistory).toHaveBeenCalledOnce()
  })

  it('omite o slot de ação quando a página não define ação', () => {
    const { container } = render(<PageHeader title="Vouchers" breadcrumbs={[{ label: 'Portal' }, { label: 'Vouchers' }]} />)
    expect(screen.getByRole('heading', { name: 'Vouchers' })).toBeVisible()
    expect(container.querySelector('.page-header-action')).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('navega por link interno sem recarregar e preserva cliques modificados', () => {
    window.history.replaceState(null, '', '/campanhas/nova')
    const push = vi.spyOn(window.history, 'pushState')
    render(<PageHeader title="Criar" breadcrumbs={[{ label: 'Campanhas', href: '/campanhas' }, { label: 'Nova' }]} />)
    const link = screen.getByRole('link', { name: 'Campanhas' })
    // JSDOM não abre novas abas: observar o evento após o React e impedir só a ação nativa do teste.
    let modifiedPrevented = true
    document.addEventListener('click', event => {
      modifiedPrevented = event.defaultPrevented
      event.preventDefault()
    }, { once: true })
    fireEvent.click(link, { ctrlKey: true })
    expect(modifiedPrevented).toBe(false)
    expect(push).not.toHaveBeenCalled()
    fireEvent.click(link)
    expect(window.location.pathname).toBe('/campanhas')
  })

  it('permite à página interceptar a saída antes da navegação', () => {
    window.history.replaceState(null, '', '/campanhas/nova')
    const intercept = vi.fn(event => event.preventDefault())
    render(<PageHeader title="Criar" breadcrumbs={[
      { label: 'Campanhas', href: '/campanhas', onClick: intercept }, { label: 'Nova' },
    ]} />)
    fireEvent.click(screen.getByRole('link', { name: 'Campanhas' }))
    expect(intercept).toHaveBeenCalledOnce()
    expect(window.location.pathname).toBe('/campanhas/nova')
  })

  it.each([
    ['/auditoria', 'Auditoria'],
  ])('integra o caminho da rota %s às páginas internas', (path, title) => {
    window.history.replaceState(null, '', path)
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeVisible()
    const breadcrumb = screen.getByRole('navigation', { name: 'Caminho' })
    expect(within(breadcrumb).getByText(title)).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: /Exportar histórico/ })).not.toBeInTheDocument()
  })
})
