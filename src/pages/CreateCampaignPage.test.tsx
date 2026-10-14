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
    expect(screen.getByRole('heading', { name: 'Alvos e benefícios' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
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


async function openBenefits() {
  localStorage.setItem(campaignDraftStorageKey, JSON.stringify({ ...initialCampaignDraft, information: { ...initialCampaignDraft.information, name: 'Campanha completa' } }))
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  return user
}

describe('Alvos e benefícios', () => {
  it('avança com a primeira etapa válida, indica conclusão e foca o título', async () => {
    await openBenefits()
    const heading = screen.getByRole('heading', { name: 'Alvos e benefícios' })
    expect(heading).toBeVisible()
    expect(heading).toHaveFocus()
    const progress = screen.getByRole('navigation', { name: 'Etapas da criação' })
    expect(within(progress).getByText('Alvos e benefícios').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(within(progress).getByText('Informações').closest('li')).toHaveTextContent('concluída')
    expect(screen.getByRole('radio', { name: 'Desconto percentual (%)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Valor total da compra' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Automática' })).toBeChecked()
    expect(screen.getByLabelText('Total previsto')).toHaveTextContent('2.500 vouchers')
    expect(screen.getByRole('button', { name: /Produtos ou categoria/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Base de clientes/ })).toBeEnabled()
    const batchQuantity = screen.getByRole('spinbutton', { name: 'Quantidade por cliente' })
    await userEvent.setup().clear(batchQuantity)
    await userEvent.setup().type(batchQuantity, '3')
    expect(batchQuantity).toHaveValue(3)
    expect(screen.getByLabelText('Total previsto')).toHaveTextContent('7.500 vouchers')
  })

  it('bloqueia avanço da primeira etapa sem nome', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.queryByRole('heading', { name: 'Alvos e benefícios' })).not.toBeInTheDocument()
    expect(screen.getByText('Informe o nome da campanha.')).toBeVisible()
  })

  it('valida desconto e quantidade máxima sem perder os valores', async () => {
    const user = await openBenefits()
    const percentage = screen.getByRole('textbox', { name: 'Valor do desconto (%)' })
    await user.clear(percentage)
    await user.type(percentage, '101')
    await user.clear(screen.getByRole('spinbutton', { name: /Quantidade máxima/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Informe um percentual maior que zero e até 100%.')).toBeVisible()
    expect(screen.getByText('Informe uma quantidade máxima inteira maior que zero.')).toBeVisible()
    expect(percentage).toHaveValue('101')
    expect(percentage).toHaveFocus()
  })

  it('alterna desconto para reais, adiciona e remove benefícios localmente', async () => {
    const user = await openBenefits()
    await user.click(screen.getByRole('radio', { name: 'Desconto com valor fixo (R$)' }))
    const fixed = screen.getByRole('textbox', { name: 'Valor do desconto (R$)' })
    expect(screen.getByRole('textbox', { name: 'Valor do desconto (%)' })).toBeEnabled()
    await user.clear(fixed)
    await user.type(fixed, '35,50')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    const list = screen.getByRole('list', { name: 'Benefícios adicionados' })
    expect(list).toHaveTextContent(/35,50/)
    expect(await screen.findByText('Benefício adicionado ao rascunho.')).toBeVisible()
    await user.click(within(list).getByRole('button', { name: 'Remover benefício 1' }))
    expect(screen.queryByRole('list', { name: 'Benefícios adicionados' })).not.toBeInTheDocument()
    await user.clear(fixed)
    await user.type(fixed, '-2')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(screen.getByText('Informe um valor em reais maior que zero, com até duas casas decimais.')).toBeVisible()
  })

  it('seleciona múltiplas categorias e preserva ao voltar e avançar', async () => {
    const user = await openBenefits()
    await user.click(screen.getByRole('radio', { name: 'Produtos ou categorias específicas' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Selecione ao menos um produto ou categoria.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Produtos ou categoria/ }))
    await user.click(await screen.findByRole('option', { name: 'Moda' }))
    await user.click(screen.getByRole('option', { name: 'Calçados' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /Produtos ou categoria/ })).toHaveTextContent('Moda')
    expect(screen.getByRole('button', { name: /Produtos ou categoria/ })).toHaveTextContent('Calçados')
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Campanha completa')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('button', { name: /Produtos ou categoria/ })).toHaveTextContent('Moda')
    expect(screen.getByRole('radio', { name: 'Produtos ou categorias específicas' })).toBeChecked()
  })

  it('muda para produtos e valida a nova seleção', async () => {
    const user = await openBenefits()
    await user.click(screen.getByRole('radio', { name: 'Produtos ou categorias específicas' }))
    await user.click(screen.getByRole('button', { name: /^Categoria Tipo$/ }))
    await user.click(await screen.findByRole('option', { name: 'Produto' }))
    await user.click(screen.getByRole('button', { name: /Produtos ou categoria/ }))
    await user.click(await screen.findByRole('option', { name: 'Camiseta demonstrativa' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Alvos e benefícios validados.')).toBeVisible()
  })

  it('valida a geração automática e mantém a segunda etapa após validar', async () => {
    const user = await openBenefits()
    const grant = screen.getByRole('spinbutton', { name: 'Quantidade por concessão' })
    await user.clear(grant)
    await user.type(grant, '0')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Informe uma quantidade por concessão inteira maior que zero.')).toBeVisible()
    await user.clear(grant)
    await user.type(grant, '2')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Alvos e benefícios validados.')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Alvos e benefícios' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Regras e público' })).not.toBeInTheDocument()
  })

  it('calcula lote por base e quantidade, ignorando campos automáticos inativos', async () => {
    const user = await openBenefits()
    await user.clear(screen.getByRole('spinbutton', { name: 'Quantidade por concessão' }))
    await user.click(screen.getByRole('radio', { name: 'Em lote' }))
    expect(screen.getByRole('spinbutton', { name: 'Quantidade por concessão' })).toBeEnabled()
    const quantity = screen.getByRole('spinbutton', { name: 'Quantidade por cliente' })
    await user.clear(quantity)
    await user.type(quantity, '2')
    expect(screen.getByLabelText('Total previsto')).toHaveTextContent('5.000 vouchers')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Alvos e benefícios validados.')).toBeVisible()
    await user.clear(quantity)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Informe uma quantidade por cliente inteira válida maior que zero.')).toBeVisible()
  })

  it('salva as duas etapas e restaura o benefício preenchido', async () => {
    const user = await openBenefits()
    const percentage = screen.getByRole('textbox', { name: 'Valor do desconto (%)' })
    await user.clear(percentage)
    await user.type(percentage, '15')
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    await user.click(within(screen.getByRole('navigation', { name: 'Caminho' })).getByRole('link', { name: 'Campanhas' }))
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }))
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Campanha completa')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('textbox', { name: 'Valor do desconto (%)' })).toHaveValue('15')
  })

  it('migra o rascunho anterior sem perder a primeira etapa', async () => {
    localStorage.setItem(campaignDraftStorageKey, JSON.stringify({ information: { ...initialCampaignDraft.information, name: 'Rascunho antigo' } }))
    const user = setup()
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue('Rascunho antigo')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('textbox', { name: 'Valor do desconto (%)' })).toHaveValue('20')
  })
})
