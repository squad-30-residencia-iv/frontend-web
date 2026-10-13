import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from '@heroui/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CampaignManagementPage } from './CampaignManagementPage'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterAll(() => vi.unstubAllGlobals())
afterEach(() => { act(() => toast.clear()) })
function setup() { render(<><CampaignManagementPage /><FeedbackProvider /></>); return userEvent.setup() }
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
  it('abre menu por teclado e fecha com Escape', async () => {
    const user = setup()
    const trigger = screen.getByRole('button', { name: 'Ações de Black Friday 2024' })
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menu')).toBeVisible()
    expect(screen.getByRole('menuitem')).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
  it('cancela e confirma aprovação com feedback', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    let dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByText('Nova campanha criada')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Aprovar' }))
    expect(await screen.findByText('Campanha aprovada')).toBeVisible()
    expect(screen.queryByText('Nova campanha criada')).not.toBeInTheDocument()
  })
  it('informa próxima etapa da criação', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }))
    expect(await screen.findByText('A criação de campanhas será implementada na próxima etapa.')).toBeVisible()
  })
  it('mostra loading sem simular requisição', () => {
    render(<CampaignManagementPage isLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando campanhas')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('mostra estado vazio quando não há registros', () => {
    render(<CampaignManagementPage campaigns={[]} />)
    expect(screen.getByRole('heading', { name: 'Nenhuma campanha encontrada' })).toBeVisible()
  })
})


