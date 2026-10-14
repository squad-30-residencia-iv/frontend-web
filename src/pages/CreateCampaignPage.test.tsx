import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from '@heroui/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { CreateCampaignPage } from './CreateCampaignPage'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { campaignDraftStorageKey, initialCampaignDraft } from '../data/campaignDraft'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/campanhas/nova') })
afterEach(() => { act(() => toast.clear()); vi.restoreAllMocks(); window.history.replaceState(null, '', '/') })
afterAll(() => vi.unstubAllGlobals())
function setup() {
  render(<><App /><FeedbackProvider /></>)
  return userEvent.setup()
}

describe('Criação de campanha', () => {
  it('navega da listagem e mantém o login acessível', async () => {
    window.history.replaceState(null, '', '/campanhas')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }))
    expect(window.location.pathname).toBe('/campanhas/nova')
    expect(screen.getByRole('heading', { name: 'Criar nova campanha' })).toBeVisible()
    await user.click(within(screen.getByRole('navigation', { name: 'Caminho' })).getByRole('link', { name: 'Campanhas' }))
    expect(screen.getByRole('heading', { name: 'Gerenciamento de Campanhas' })).toBeVisible()
    act(() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) })
    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible()
  })

  it('abre a URL diretamente e mostra campos, datas e etapa atual', () => {
    setup()
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toBeRequired()
    expect(screen.getByLabelText('Início da vigência')).toHaveValue('2026-10-01T08:00')
    expect(screen.getByLabelText('Fim da vigência')).toHaveValue('2026-10-31T23:59')
    expect(screen.getByRole('spinbutton', { name: 'Duração' })).toHaveValue(30)
    expect(screen.getByRole('button', { name: /Modelo/ })).toHaveTextContent('Prazo relativo')
    expect(screen.getByRole('button', { name: /Teto máximo/ })).toHaveTextContent('Sem teto')
    expect(screen.getByText('Informações').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(within(screen.getByRole('complementary', { name: 'Resumo da configuração' })).getByText('Informações básicas').closest('li')).toHaveTextContent('Informações básicas: pendente')
  })

  it('valida obrigatórios e foca o primeiro campo inválido', async () => {
    const user = setup()
    fireEvent.change(screen.getByLabelText('Início da vigência'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Fim da vigência'), { target: { value: '' } })
    await user.clear(screen.getByRole('spinbutton', { name: 'Duração' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Informe o nome da campanha.')).toBeVisible()
    expect(screen.getByText('Informe uma data e hora de início válidas.')).toBeVisible()
    expect(screen.getByText('Informe uma data e hora de fim válidas.')).toBeVisible()
    expect(screen.getByText('Informe uma quantidade inteira de dias maior que zero.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveFocus()
  })

  it('valida ordem de datas e duração e permite corrigir os campos', async () => {
    const user = setup()
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Volta às Aulas 2026')
    fireEvent.change(screen.getByLabelText('Fim da vigência'), { target: { value: '2026-09-30T23:59' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Duração' }), { target: { value: '0' } })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('O fim da vigência não pode ser anterior ao início.')).toBeVisible()
    expect(screen.getByRole('spinbutton', { name: 'Duração' })).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(screen.getByLabelText('Fim da vigência'), { target: { value: '2026-10-31T23:59' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Duração' }), { target: { value: '45' } })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Informações básicas validadas.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Volta às Aulas 2026')
    expect(screen.getByRole('spinbutton', { name: 'Duração' })).toHaveValue(45)
    expect(window.location.pathname).toBe('/campanhas/nova')
    expect(within(screen.getByRole('complementary', { name: 'Resumo da configuração' })).getByText('Informações básicas').closest('li')).toHaveTextContent('Informações básicas: completo')
  })

  it('retorna pela sidebar sem alterações', async () => {
    const user = setup()
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Campanhas' }))
    expect(screen.getByRole('heading', { name: 'Gerenciamento de Campanhas' })).toBeVisible()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('confirma descarte, permite cancelar e devolve foco', async () => {
    const user = setup()
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Campanha em edição')
    const link = within(screen.getByRole('navigation', { name: 'Caminho' })).getByRole('link', { name: 'Campanhas' })
    await user.click(link)
    const dialog = await screen.findByRole('alertdialog', { name: 'Descartar alterações?' })
    await user.click(within(dialog).getByRole('button', { name: 'Continuar editando' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Campanha em edição')
    await waitFor(() => expect(link).toHaveFocus())
    await user.click(link)
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Descartar alterações' }))
    expect(screen.getByRole('heading', { name: 'Gerenciamento de Campanhas' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }))
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('')
  })

  it('salva rascunho local e restaura ao voltar', async () => {
    const user = setup()
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Rascunho local')
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    expect(await screen.findByText('Rascunho salvo neste navegador.')).toBeVisible()
    await user.click(within(screen.getByRole('navigation', { name: 'Caminho' })).getByRole('link', { name: 'Campanhas' }))
    expect(screen.getByRole('heading', { name: 'Gerenciamento de Campanhas' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }))
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Rascunho local')
  })

  it('permite salvar incompleto e valida as seleções obrigatórias ao continuar', async () => {
    localStorage.setItem(campaignDraftStorageKey, JSON.stringify({ information: { ...initialCampaignDraft.information, voucherModel: '', voucherCap: '' } }))
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    expect(await screen.findByText('Rascunho salvo neste navegador.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Selecione o modelo de validade.')).toBeVisible()
    expect(screen.getByText('Selecione o teto máximo.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Modelo/ }))
    await user.click(await screen.findByRole('option', { name: 'Prazo relativo' }))
    expect(screen.queryByText('Selecione o modelo de validade.')).not.toBeInTheDocument()
  })

  it('ignora rascunhos inválidos e informa falha ao salvar sem perder dados', async () => {
    localStorage.setItem(campaignDraftStorageKey, '{inválido')
    const user = setup()
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('')
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Manter dados')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage indisponível') })
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    expect(await screen.findByText('Não foi possível salvar o rascunho.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Manter dados')
  })

  it('protege a recarga apenas enquanto existem alterações não salvas', async () => {
    const user = setup()
    const cleanEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(cleanEvent)
    expect(cleanEvent.defaultPrevented).toBe(false)
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Alterações')
    const dirtyEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirtyEvent)
    expect(dirtyEvent.defaultPrevented).toBe(true)
  })

  it('restaura um rascunho com datas impossíveis e rejeita a continuidade', async () => {
    localStorage.setItem(campaignDraftStorageKey, JSON.stringify({ information: { ...initialCampaignDraft.information, name: 'Teste', start: '2026-02-31T08:00' } }))
    render(<><CreateCampaignPage /><FeedbackProvider /></>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Informe uma data e hora de início válidas.')).toBeVisible()
  })
})
