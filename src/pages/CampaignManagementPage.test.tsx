import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CampaignManagementPage } from './CampaignManagementPage'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { getCampaigns } from '../data/campaignRepository'
import { clearToasts } from '../test/clearToasts'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterAll(() => vi.unstubAllGlobals())
afterEach(clearToasts)
beforeEach(() => localStorage.clear())
function setup() {
  render(<><CampaignManagementPage campaigns={getCampaigns()} /><FeedbackProvider /></>)
  return userEvent.setup()
}
describe('Gerenciamento de Campanhas', () => {
  it('mostra referência, indicadores e sete campanhas na primeira página', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Gerenciamento de Campanhas' })).toBeVisible()
    expect(screen.getByText('Black Friday 2024')).toBeVisible()
    expect(screen.getByText('Semana do Consumidor')).toBeVisible()
    expect(screen.getAllByRole('row')).toHaveLength(8)
    expect(screen.getByText(/campanhas cadastradas/)).toHaveTextContent('Exibindo 7 de 80')
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
  })
  it('busca sem diferenciar acentos e limpa o estado vazio', async () => {
    const user = setup()
    const input = screen.getByRole('textbox', { name: 'Buscar campanha' })
    await user.type(input, 'maes')
    expect(screen.getByText('Dia das Mães Premiado')).toBeVisible()
    expect(screen.queryByText('Black Friday 2024')).not.toBeInTheDocument()
    await user.type(input, 'inexistente')
    expect(screen.getByRole('heading', { name: 'Nenhuma campanha encontrada' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(input).toHaveValue('')
    expect(screen.getByText('Black Friday 2024')).toBeVisible()
  })
  it('filtra status e período e redefine a página', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    await user.click(screen.getByRole('button', { name: /Status:/ }))
    await user.click(await screen.findByRole('option', { name: 'Pausada' }))
    expect(screen.getByText('Aniversário da Loja 15 Anos')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: /Período:/ }))
    await user.click(await screen.findByRole('option', { name: 'Últimos 30 dias' }))
    expect(screen.queryByText('Aniversário da Loja 15 Anos')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText(/referência em 30\/11\/2024/)).toBeVisible()
  })
  it('navega até a última página e retorna', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Página 12' }))
    expect(screen.getByText(/campanhas cadastradas/)).toHaveTextContent('Exibindo 3 de 80')
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByRole('button', { name: 'Página 11' })).toHaveAttribute('aria-current', 'page')
  })
  it('não oferece ações de status', () => {
    setup()
    expect(screen.queryByRole('button', { name: /Ações de/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submeter' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Ações' })).not.toBeInTheDocument()
  })
  it('abre os detalhes pelo nome da campanha', async () => {
    const user = setup()
    const link = screen.getByRole('link', { name: 'Black Friday 2024' })
    expect(link).toHaveAttribute('href', '/campanhas/1')
    await user.click(link)
    expect(window.location.pathname).toBe('/campanhas/1')
  })
  it('navega para a criação', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }))
    expect(window.location.pathname).toBe('/campanhas/nova')
  })
  it('mostra loading sem simular requisição', () => {
    render(<CampaignManagementPage isLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando campanhas')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('mostra estado vazio quando não há registros', () => {
    render(<CampaignManagementPage campaigns={[]} />)
    expect(screen.getByRole('heading', { name: 'Nenhuma campanha nesta rede' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })
})