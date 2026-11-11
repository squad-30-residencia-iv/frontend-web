import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { AuthProvider } from '../contexts/AuthContext'
import { mockUsers } from '../mocks/handlers/auth'
import { mockNetworkId, registryState } from '../mocks/handlers/registry'
import { generateMockJwt } from '../mocks/jwtUtils'
import { server } from '../mocks/server'
import { api } from '../services/api'
import { TOKEN_KEY, USER_KEY } from '../services/tokenStorage'
import { clearToasts } from '../test/clearToasts'

// O indicador da aba anima com element.getAnimations, que o jsdom não tem.
const originalGetAnimations = Element.prototype.getAnimations

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
  Element.prototype.getAnimations = () => []
})
afterAll(() => {
  vi.unstubAllGlobals()
  Element.prototype.getAnimations = originalGetAnimations
})
afterEach(clearToasts)
afterEach(() => window.history.replaceState(null, '', '/'))

type MockEmail = 'admin@portal.dev' | 'analista@portal.dev' | 'gestor@portal.dev'

function renderRegistry(email: MockEmail = 'admin@portal.dev') {
  const user = mockUsers[email].user
  localStorage.setItem(TOKEN_KEY, generateMockJwt(user, 3600))
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.history.pushState({}, '', '/cadastros')
  render(<AuthProvider><App /><FeedbackProvider /></AuthProvider>)
  return userEvent.setup()
}

function column(name: string) {
  return screen.getByRole('region', { name })
}

async function rowOf(columnName: string, rowName: string) {
  const item = await within(column(columnName)).findByText(rowName)
  const row = item.closest('li')
  if (!row) throw new Error(`Linha ${rowName} não encontrada`)
  return row
}

async function openItem(user: ReturnType<typeof userEvent.setup>, columnName: string, rowName: string) {
  await user.click(await within(column(columnName)).findByRole('button', { name: rowName }))
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, dialogName: string, fields: Record<string, string>, submit = 'Cadastrar') {
  const dialog = await screen.findByRole('dialog', { name: dialogName })
  for (const [label, value] of Object.entries(fields)) {
    const input = within(dialog).getByRole('textbox', { name: label })
    await user.clear(input)
    await user.type(input, value)
  }
  await user.click(within(dialog).getByRole('button', { name: submit }))
  return dialog
}

describe('Cadastros: hierarquia', () => {
  it('lista redes, regiões da rede e lojas da região, com o status visível', async () => {
    registryState.regions.push({ id: 'region-north', networkId: mockNetworkId, name: 'Norte', isActive: false, createdAt: '2026-09-01T12:00:00Z' })
    const user = renderRegistry()

    expect(screen.getByRole('heading', { level: 1, name: 'Cadastros' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Cadastros' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('tab', { name: 'Hierarquia' })).toHaveAttribute('aria-selected', 'true')
    expect(within(column('Regiões')).getByRole('heading', { name: 'Escolha uma rede' })).toBeVisible()

    expect(await rowOf('Redes', 'Rede Exemplo')).toHaveTextContent('Fuso America/Sao_Paulo')
    expect(await rowOf('Redes', 'Rede Exemplo')).toHaveTextContent('Ativa')
    await openItem(user, 'Redes', 'Rede Exemplo')
    expect(within(column('Redes')).getByRole('button', { name: 'Rede Exemplo' })).toHaveAttribute('aria-pressed', 'true')

    expect(await rowOf('Regiões', 'Norte')).toHaveTextContent('Inativa')
    expect(await rowOf('Regiões', 'Sudeste')).toHaveTextContent('Ativa')
    expect(within(column('Regiões')).getByText('1 ativa · 1 inativa')).toBeVisible()
    const regionNames = within(column('Regiões')).getAllByRole('listitem').map(item => item.querySelector('.registry-row-name')?.textContent)
    expect(regionNames).toEqual(['Sudeste', 'Norte'])
    expect(within(await rowOf('Regiões', 'Norte')).getByRole('button', { name: 'Reativar região Norte' })).toBeVisible()

    await openItem(user, 'Regiões', 'Sudeste')
    expect(await rowOf('Lojas', 'Loja Centro')).toHaveTextContent('Código 001 · Físico')
  })

  it('cria rede, região e loja com os canais; loja sem canal não é enviada', async () => {
    const user = renderRegistry()

    await user.click(await within(column('Redes')).findByRole('button', { name: 'Nova rede' }))
    const networkDialog = await screen.findByRole('dialog', { name: 'Nova rede' })
    expect(within(networkDialog).getByRole('textbox', { name: 'Fuso horário' })).toHaveValue('America/Sao_Paulo')
    await fillAndSubmit(user, 'Nova rede', { Nome: 'Rede Sul' })
    expect(await screen.findByText('Rede criada.')).toBeVisible()
    expect(await rowOf('Redes', 'Rede Sul')).toHaveTextContent('Ativa')
    expect(screen.queryByRole('dialog', { name: 'Nova rede' })).not.toBeInTheDocument()

    await openItem(user, 'Redes', 'Rede Sul')
    expect(await within(column('Regiões')).findByRole('heading', { name: 'Nenhuma região cadastrada' })).toBeVisible()
    await user.click(within(column('Regiões')).getByRole('button', { name: 'Nova região' }))
    expect(within(await screen.findByRole('dialog', { name: 'Nova região' })).getByText('Rede: Rede Sul')).toBeVisible()
    await fillAndSubmit(user, 'Nova região', { Nome: 'Centro-Oeste' })
    expect(await screen.findByText('Região criada.')).toBeVisible()

    await openItem(user, 'Regiões', 'Centro-Oeste')
    await user.click(await within(column('Lojas')).findByRole('button', { name: 'Nova loja' }))
    const storeDialog = await fillAndSubmit(user, 'Nova loja', { Código: '010', Nome: 'Loja Shopping' })
    expect(within(storeDialog).getByRole('alert')).toHaveTextContent('Escolha ao menos um canal.')
    expect(registryState.establishments.some(store => store.code === '010')).toBe(false)

    await user.click(within(storeDialog).getByRole('checkbox', { name: 'Físico' }))
    await user.click(within(storeDialog).getByRole('checkbox', { name: 'Virtual' }))
    await user.click(within(storeDialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Loja criada.')).toBeVisible()
    expect(await rowOf('Lojas', 'Loja Shopping')).toHaveTextContent('Código 010 · Físico e Virtual')
    expect(registryState.establishments.find(store => store.code === '010')?.channels).toEqual(['Physical', 'Virtual'])
  })

  it('inativar a rede pede confirmação, avisa a cascata e inativa regiões e lojas', async () => {
    const user = renderRegistry()
    await openItem(user, 'Redes', 'Rede Exemplo')
    await openItem(user, 'Regiões', 'Sudeste')
    await rowOf('Lojas', 'Loja Centro')

    await user.click(within(await rowOf('Redes', 'Rede Exemplo')).getByRole('button', { name: 'Inativar rede Rede Exemplo' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Inativar a rede Rede Exemplo?' })
    expect(confirm).toHaveTextContent('Inativar a rede inativa as regiões e lojas dela.')
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(registryState.networks[0].isActive).toBe(true)

    await user.click(within(await rowOf('Redes', 'Rede Exemplo')).getByRole('button', { name: 'Inativar rede Rede Exemplo' }))
    await user.click(within(await screen.findByRole('alertdialog', { name: 'Inativar a rede Rede Exemplo?' })).getByRole('button', { name: 'Inativar' }))
    expect(await screen.findByText('Rede inativada.')).toBeVisible()
    expect(screen.getByText('As regiões e lojas dela também ficaram inativas.')).toBeVisible()

    await waitFor(async () => expect(await rowOf('Redes', 'Rede Exemplo')).toHaveTextContent('Inativa'))
    await waitFor(async () => expect(await rowOf('Regiões', 'Sudeste')).toHaveTextContent('Inativa'))
    await waitFor(async () => expect(await rowOf('Lojas', 'Loja Centro')).toHaveTextContent('Inativa'))
    expect(within(await rowOf('Redes', 'Rede Exemplo')).getByRole('button', { name: 'Reativar rede Rede Exemplo' })).toBeVisible()
    expect(within(column('Regiões')).getByRole('button', { name: 'Nova região' })).toBeDisabled()
    expect(within(column('Regiões')).getByText('Reative a rede para cadastrar regiões.')).toBeVisible()
  })

  it('nome repetido mostra o detail dentro do formulário, sem fechar', async () => {
    const user = renderRegistry()
    await user.click(await within(column('Redes')).findByRole('button', { name: 'Nova rede' }))
    const dialog = await fillAndSubmit(user, 'Nova rede', { Nome: 'Rede Exemplo' })

    expect(await within(dialog).findByText('Já existe uma rede cadastrada com este nome.')).toBeVisible()
    expect(screen.getByRole('dialog', { name: 'Nova rede' })).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: 'Nome' })).toHaveValue('Rede Exemplo')
    expect(registryState.networks).toHaveLength(1)
  })

  it('valida o formulário antes de enviar e leva o foco ao campo', async () => {
    const user = renderRegistry()
    await user.click(await within(column('Redes')).findByRole('button', { name: 'Nova rede' }))
    const dialog = await fillAndSubmit(user, 'Nova rede', { 'Fuso horário': 'Lua/Base' })

    expect(within(dialog).getByText('Informe o nome da rede.')).toBeVisible()
    expect(within(dialog).getByText('Informe um fuso IANA válido, como America/Sao_Paulo.')).toBeVisible()
    expect(within(dialog).getByRole('textbox', { name: 'Nome' })).toHaveFocus()
    expect(registryState.networks).toHaveLength(1)
  })

  it('falha ao carregar mostra o erro e tenta de novo', async () => {
    let calls = 0
    server.use(http.get('*/api/v1/networks', () => {
      calls += 1
      return calls === 1
        ? HttpResponse.json({ status: 500, detail: 'Serviço indisponível.', code: 'INTERNAL_ERROR' }, { status: 500 })
        : HttpResponse.json(registryState.networks)
    }))
    const user = renderRegistry()

    expect(await within(column('Redes')).findByRole('heading', { name: 'Não foi possível carregar as redes' })).toBeVisible()
    expect(within(column('Redes')).getByText('Serviço indisponível.')).toBeVisible()
    await user.click(within(column('Redes')).getByRole('button', { name: 'Tentar novamente' }))
    expect(await rowOf('Redes', 'Rede Exemplo')).toBeVisible()
  })
})

describe('Cadastros: catálogo', () => {
  it('edita uma categoria e cria um produto nela', async () => {
    const user = renderRegistry()
    await user.click(screen.getByRole('tab', { name: 'Catálogo' }))

    await user.click(within(await rowOf('Categorias', 'Papelaria')).getByRole('button', { name: 'Editar categoria Papelaria' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar categoria' })
    expect(within(dialog).getByRole('textbox', { name: 'Nome' })).toHaveValue('Papelaria')
    await fillAndSubmit(user, 'Editar categoria', { Nome: 'Papelaria e escritório' }, 'Salvar alterações')
    expect(await screen.findByText('Categoria atualizada.')).toBeVisible()
    expect(await rowOf('Categorias', 'Papelaria e escritório')).toHaveTextContent('Ativa')

    await openItem(user, 'Categorias', 'Papelaria e escritório')
    expect(await rowOf('Produtos', 'Caderno')).toHaveTextContent('Código CAD-1')
    expect(await rowOf('Produtos', 'Caderno')).toHaveTextContent('Ativo')
    await user.click(within(column('Produtos')).getByRole('button', { name: 'Novo produto' }))
    await fillAndSubmit(user, 'Novo produto', { Código: 'CAN-1', Nome: 'Caneta' })
    expect(await screen.findByText('Produto criado.')).toBeVisible()
    expect(await rowOf('Produtos', 'Caneta')).toHaveTextContent('Código CAN-1')
    expect(registryState.products.find(product => product.code === 'CAN-1')?.categoryId).toBe(registryState.categories[0].id)
  })

  it('inativar a categoria inativa os produtos; reativar o produto com a categoria inativa mostra o detail', async () => {
    const user = renderRegistry()
    await user.click(screen.getByRole('tab', { name: 'Catálogo' }))
    await openItem(user, 'Categorias', 'Papelaria')
    await rowOf('Produtos', 'Caderno')

    await user.click(within(await rowOf('Categorias', 'Papelaria')).getByRole('button', { name: 'Inativar categoria Papelaria' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Inativar a categoria Papelaria?' })
    expect(confirm).toHaveTextContent('Inativar a categoria inativa os produtos dela.')
    await user.click(within(confirm).getByRole('button', { name: 'Inativar' }))
    expect(await screen.findByText('Categoria inativada.')).toBeVisible()
    await waitFor(async () => expect(await rowOf('Produtos', 'Caderno')).toHaveTextContent('Inativo'))

    await user.click(within(await rowOf('Produtos', 'Caderno')).getByRole('button', { name: 'Reativar produto Caderno' }))
    expect(await screen.findByText('Não foi possível reativar o produto.')).toBeVisible()
    expect(screen.getByText('Categoria informada está inativa')).toBeVisible()
    expect(registryState.products[0].isActive).toBe(false)

    await user.click(within(await rowOf('Categorias', 'Papelaria')).getByRole('button', { name: 'Reativar categoria Papelaria' }))
    expect(await screen.findByText('Categoria reativada.')).toBeVisible()
    await waitFor(async () => expect(await rowOf('Categorias', 'Papelaria')).toHaveTextContent('Ativa'))
    expect(await rowOf('Produtos', 'Caderno')).toHaveTextContent('Inativo')
  })
})

describe('Cadastros: acesso', () => {
  it.each<MockEmail>(['analista@portal.dev', 'gestor@portal.dev'])('%s não vê a seção e, pela URL, vê acesso restrito', async email => {
    const get = vi.spyOn(api, 'get')
    renderRegistry(email)

    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).queryByRole('link', { name: 'Cadastros' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Hierarquia' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova rede' })).not.toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
    get.mockRestore()
  })
})
