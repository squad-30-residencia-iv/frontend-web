import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { homeOverview } from '../data/homeOverview'
import type { HomeOverview } from '../types/home'
import { HomePage } from './HomePage'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
beforeEach(() => { window.history.replaceState(null, '', '/home') })
afterEach(() => { window.history.replaceState(null, '', '/') })
afterAll(() => vi.unstubAllGlobals())

const loadMock = () => Promise.resolve(homeOverview)
const loadWithEmptyCategory = () => Promise.resolve<HomeOverview>({
  ...homeOverview,
  categories: [...homeOverview.categories, { id: 'toys', label: 'Brinquedos' }],
})

async function renderHome(loadOverview: () => Promise<HomeOverview> = loadMock) {
  const user = userEvent.setup()
  render(<HomePage loadOverview={loadOverview} />)
  await screen.findByRole('group', { name: 'Filtrar campanhas por categoria' })
  return user
}
const cardHeading = (name: string) => screen.getByRole('heading', { level: 3, name })
const queryCardHeading = (name: string) => screen.queryByRole('heading', { level: 3, name })

describe('Home', () => {
  it('mostra Sidebar, saudação exclusiva, banner, categorias e cards', async () => {
    await renderHome()
    const sidebar = screen.getByRole('complementary', { name: 'Navegação do portal' })
    expect(within(sidebar).getByRole('navigation', { name: 'Principal' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Olá, Lucas!' })).toBeVisible()
    expect(screen.getByText('DESTAQUE DA SEMANA')).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Black Friday 2024' })).toBeVisible()
    expect(within(screen.getByRole('group', { name: 'Filtrar campanhas por categoria' })).getAllByRole('button')).toHaveLength(6)
    expect(screen.getAllByRole('article')).toHaveLength(7)
    expect(cardHeading('Natal Premiado')).toBeVisible()
  })

  it('não renderiza o PageHeader genérico (breadcrumb e botão de ação)', async () => {
    await renderHome()
    expect(screen.queryByRole('navigation', { name: 'Caminho' })).not.toBeInTheDocument()
    expect(screen.queryByText('Portal', { selector: 'span' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova campanha' })).not.toBeInTheDocument()
  })

  it('exibe os cinco itens da Sidebar com Visão geral ativa e o perfil no rodapé', async () => {
    await renderHome()
    const navigation = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(navigation).getAllByRole('link').map(link => link.textContent)).toEqual(['Visão geral', 'Campanhas', 'Vouchers', 'Relatórios', 'Auditoria'])
    expect(within(navigation).getByRole('link', { name: 'Visão geral' })).toHaveAttribute('aria-current', 'page')
    expect(within(navigation).getByRole('link', { name: 'Campanhas' })).not.toHaveAttribute('aria-current')
    const sidebar = screen.getByRole('complementary', { name: 'Navegação do portal' })
    expect(within(sidebar).getByText('Lucas Silva')).toBeVisible()
    expect(within(sidebar).getByText('Gestor de Marketing')).toBeVisible()
  })

  it('mostra a saudação enquanto carrega e depois o conteúdo', async () => {
    let resolveOverview: (overview: HomeOverview) => void = () => {}
    const pending = new Promise<HomeOverview>(resolve => { resolveOverview = resolve })
    render(<HomePage loadOverview={() => pending} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Olá, Lucas!' })).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando campanhas…')
    await act(async () => { resolveOverview(homeOverview) })
    expect(await screen.findByText('DESTAQUE DA SEMANA')).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('filtra por categoria e volta a mostrar todas', async () => {
    const user = await renderHome()
    await user.click(screen.getByRole('button', { name: 'Moda' }))
    expect(screen.getByRole('button', { name: 'Moda' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(cardHeading('Volta às Aulas Kids')).toBeVisible()
    expect(cardHeading('Liquidação de Verão')).toBeVisible()
    expect(queryCardHeading('Natal Premiado')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Todas' }))
    expect(screen.getAllByRole('article')).toHaveLength(7)
  })

  it('mostra o estado vazio de uma categoria sem campanhas e permite ver todas', async () => {
    const user = await renderHome(loadWithEmptyCategory)
    await user.click(screen.getByRole('button', { name: 'Brinquedos' }))
    expect(screen.getByRole('heading', { name: 'Nenhuma campanha nesta categoria' })).toBeVisible()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Ver todas as campanhas' }))
    expect(screen.getAllByRole('article')).toHaveLength(7)
  })

  it('mostra erro amigável e recupera ao tentar novamente', async () => {
    const loadOverview = vi.fn<() => Promise<HomeOverview>>()
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValue(homeOverview)
    const user = userEvent.setup()
    render(<HomePage loadOverview={loadOverview} />)
    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar as campanhas' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 1, name: 'Olá, Lucas!' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('DESTAQUE DA SEMANA')).toBeVisible()
    expect(loadOverview).toHaveBeenCalledTimes(2)
  })

  it('leva o botão do banner para /campanhas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('DESTAQUE DA SEMANA')
    await user.click(screen.getByRole('button', { name: 'Ver campanha' }))
    expect(window.location.pathname).toBe('/campanhas')
    expect(screen.getByRole('heading', { name: 'Gerenciamento de Campanhas' })).toBeVisible()
  })

  it('atualiza a URL ao clicar em Auditoria na Sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('DESTAQUE DA SEMANA')
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Auditoria' }))
    await waitFor(() => expect(window.location.pathname).toBe('/auditoria'))
    expect(screen.getByRole('heading', { level: 1, name: 'Auditoria' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Em construção' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Auditoria' })).toHaveAttribute('aria-current', 'page')
  })

  it('volta à Home pela Sidebar a partir de outra seção', async () => {
    window.history.replaceState(null, '', '/vouchers')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Consulta de Vouchers' })).toBeVisible()
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Visão geral' }))
    expect(window.location.pathname).toBe('/home')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Lucas!' })).toBeVisible()
  })
})
