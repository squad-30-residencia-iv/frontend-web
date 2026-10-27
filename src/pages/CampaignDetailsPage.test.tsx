import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { referenceCampaignId } from '../data/campaignDetails'
import { clearToasts } from '../test/clearToasts'
import { CampaignDetailsPage } from './CampaignDetailsPage'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
afterAll(() => vi.unstubAllGlobals())
afterEach(clearToasts)
afterEach(() => window.history.replaceState(null, '', '/'))

function setup(campaignId = referenceCampaignId) {
  render(<><CampaignDetailsPage campaignId={campaignId} /><FeedbackProvider /></>)
  return userEvent.setup()
}

describe('Detalhes da campanha: campanha de referência', () => {
  it('mostra cabeçalho, caminho, resumo e aviso de demonstração', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Detalhes da campanha' })).toBeVisible()
    const path = screen.getByRole('navigation', { name: 'Caminho' })
    expect(within(path).getAllByRole('listitem').map(item => item.textContent)).toEqual(['Portal', 'Campanhas', 'Detalhes da campanha'])
    expect(within(path).getByRole('link', { name: 'Campanhas' })).toHaveAttribute('href', '/campanhas')
    const sidebar = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(sidebar).getByRole('link', { name: 'Campanhas' })).toHaveAttribute('aria-current', 'page')

    const summary = screen.getByRole('region', { name: 'Resumo da campanha' })
    expect(within(summary).getByRole('heading', { level: 2, name: 'Material novo, ideias novas' })).toBeVisible()
    expect(summary).toHaveTextContent('Papelaria')
    expect(summary).toHaveTextContent('Ativa')
    expect(summary).toHaveTextContent('Cadernos, estojos e itens criativos para renovar sua rotina.')
    expect(summary).toHaveTextContent('20% OFF')
    expect(summary).toHaveTextContent('Até 31 out')
    expect(screen.getByText(/Referência temporal: 05\/10\/2026, 12:00/)).toBeVisible()
  })

  it('mostra as cinco métricas de desempenho', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Desempenho da campanha' })).toBeVisible()
    expect(screen.getByRole('article', { name: 'Vouchers emitidos' })).toHaveTextContent('1.240')
    expect(screen.getByRole('article', { name: 'Vouchers emitidos' })).toHaveTextContent('24,8% do limite de 5.000')
    expect(screen.getByRole('article', { name: 'Vouchers utilizados' })).toHaveTextContent('496')
    expect(screen.getByRole('article', { name: 'Vouchers utilizados' })).toHaveTextContent('Validações confirmadas')
    expect(screen.getByRole('article', { name: 'Ainda disponíveis' })).toHaveTextContent('744')
    expect(screen.getByRole('article', { name: 'Vouchers expirados' })).toHaveTextContent('Sem utilização')
    expect(screen.getByRole('article', { name: 'Taxa de utilização' })).toHaveTextContent('40,0%')
    expect(screen.getByRole('article', { name: 'Taxa de utilização' })).toHaveTextContent('496 de 1.240 emitidos')
  })

  it('mostra vigência, tempo restante e validade dos vouchers', () => {
    setup()
    const schedule = screen.getByRole('region', { name: 'Vigência da campanha' })
    expect(schedule).toHaveTextContent('Em andamento')
    expect(schedule).toHaveTextContent('26 dias para encerrar')
    expect(schedule).toHaveTextContent('Mais 11h 59min · emissão de vouchers ativa')
    expect(schedule).toHaveTextContent('01/10/2026 · 08:00')
    expect(schedule).toHaveTextContent('31/10/2026 · 23:59')
    expect(schedule).toHaveTextContent('Após o encerramento, não serão emitidos novos vouchers.')
    expect(within(schedule).getByRole('progressbar', { name: 'Progresso da vigência' })).toHaveAttribute('value', '14')

    const validity = screen.getByRole('region', { name: 'Validade dos vouchers' })
    expect(validity).toHaveTextContent('Prazo relativo')
    expect(validity).toHaveTextContent('30 dias após a emissão')
    expect(validity).toHaveTextContent('Sem teto máximo · independente da vigência da campanha.')
    expect(validity).toHaveTextContent('VCH-PAP1238')
    expect(validity).toHaveTextContent('Utilizado')
    expect(validity).toHaveTextContent('05/10/2026 · 11:52')
    expect(validity).toHaveTextContent('***.203.***-55')
  })

  it('lista os cinco últimos vouchers com status, ações e rodapé', () => {
    setup()
    const table = screen.getByRole('table', { name: 'Últimos vouchers emitidos' })
    expect(within(table).getAllByRole('columnheader').map(header => header.textContent)).toEqual([
      'Código', 'Cliente', 'Data de emissão', 'Validade', 'Usos', 'Status', 'Ações',
    ])
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    const available = within(table).getByRole('row', { name: /VCH-PAP1240/ })
    expect(available).toHaveTextContent('***.482.***-10')
    expect(available).toHaveTextContent('05/10/2026 · 11:48')
    expect(available).toHaveTextContent('04/11/2026 · 11:48')
    expect(available).toHaveTextContent('0/1')
    expect(available).toHaveTextContent('Disponível')
    const used = within(table).getByRole('row', { name: /VCH-PAP1238/ })
    expect(used).toHaveTextContent('1/1')
    expect(used).toHaveTextContent('Utilizado')
    expect(within(table).getByRole('button', { name: 'Ações de VCH-PAP1240' })).toBeVisible()
    expect(screen.getByText('5 registros mais recentes de 1.240 vouchers emitidos')).toBeVisible()
    expect(screen.getByText('Ordenados por emissão, do mais recente ao mais antigo')).toBeVisible()
  })

  it('"Ver todos os vouchers" leva para a seção de vouchers', async () => {
    const user = setup()
    await user.click(screen.getByRole('link', { name: 'Ver todos os vouchers' }))
    expect(window.location.pathname).toBe('/vouchers')
  })

  it('mostra os três blocos de informações detalhadas', () => {
    setup()
    const info = screen.getByRole('region', { name: 'Informações detalhadas' })
    for (const title of ['Alvos e benefícios', 'Regras e público', 'Escopo e canais']) {
      expect(within(info).getByRole('heading', { name: title })).toBeVisible()
    }
    expect(info).toHaveTextContent('20% sobre o valor total da compra')
    expect(info).toHaveTextContent('5.000 vouchers / 1 voucher')
    expect(info).toHaveTextContent('Compra maior ou igual a R$ 200,00')
    expect(info).toHaveTextContent('Todas as condições e restrições — E')
  })

  it('informa que Pausar e Editar ainda não estão disponíveis', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Ação em breve')).toBeVisible()
  })
})

describe('Detalhes da campanha: campanhas da listagem', () => {
  it('monta os detalhes a partir da listagem', () => {
    setup('1')
    const summary = screen.getByRole('region', { name: 'Resumo da campanha' })
    expect(within(summary).getByRole('heading', { level: 2, name: 'Black Friday 2024' })).toBeVisible()
    expect(summary).toHaveTextContent('Eletro')
    expect(summary).toHaveTextContent('Até 30% OFF')
    expect(screen.getByRole('article', { name: 'Vouchers emitidos' })).toHaveTextContent('15.000')
    expect(screen.getByRole('article', { name: 'Vouchers emitidos' })).toHaveTextContent('Emitidos nesta campanha')
    expect(screen.getByRole('article', { name: 'Vouchers utilizados' })).toHaveTextContent('13.200')
    expect(screen.getByRole('article', { name: 'Ainda disponíveis' })).toHaveTextContent('1.800')
    expect(screen.getByRole('article', { name: 'Taxa de utilização' })).toHaveTextContent('88,0%')
    expect(screen.getByRole('region', { name: 'Vigência da campanha' })).toHaveTextContent('Em andamento')
    expect(within(screen.getByRole('table')).getByRole('rowheader', { name: 'VCH-BLA15000' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Informações detalhadas' })).toHaveTextContent('Nacional (Todas as Lojas)')
  })

  it('campanha agendada mostra que ainda não iniciou', () => {
    setup('2')
    const schedule = screen.getByRole('region', { name: 'Vigência da campanha' })
    expect(schedule).toHaveTextContent('Agendada')
    expect(schedule).toHaveTextContent('Campanha ainda não iniciada')
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeVisible()
  })

  it('campanha encerrada não oferece pausar nem retomar', () => {
    setup('3')
    const schedule = screen.getByRole('region', { name: 'Vigência da campanha' })
    expect(schedule).toHaveTextContent('Encerrada')
    expect(schedule).toHaveTextContent('Campanha encerrada')
    expect(schedule).toHaveTextContent('A emissão de novos vouchers foi encerrada.')
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retomar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar campanha' })).toBeVisible()
  })

  it('campanha pausada mostra Retomar e a emissão pausada', () => {
    setup('4')
    const schedule = screen.getByRole('region', { name: 'Vigência da campanha' })
    expect(schedule).toHaveTextContent('Pausada')
    expect(schedule).toHaveTextContent('emissão de vouchers pausada')
    expect(screen.getByRole('button', { name: 'Retomar' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
  })
})

describe('Detalhes da campanha: rota e erros', () => {
  it('campanha inexistente mostra o estado vazio e volta para a listagem', async () => {
    const user = setup('inexistente')
    expect(screen.getByRole('heading', { level: 1, name: 'Detalhes da campanha' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Campanha não encontrada' })).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Resumo da campanha' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar para campanhas' }))
    expect(window.location.pathname).toBe('/campanhas')
  })

  it('o App resolve /campanhas/:id e mantém /campanhas/nova na criação', () => {
    window.history.replaceState(null, '', '/campanhas/3')
    render(<App />)
    expect(screen.getByRole('heading', { level: 2, name: 'Volta às Aulas Kids' })).toBeVisible()
  })

  it('o App não quebra com um endereço malformado', () => {
    window.history.replaceState(null, '', '/campanhas/%E0%A4%A')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Campanha não encontrada' })).toBeVisible()
  })
})
