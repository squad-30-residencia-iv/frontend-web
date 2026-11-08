import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CampaignManagementPage } from './CampaignManagementPage'
import { CampaignDetailsPage } from './CampaignDetailsPage'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { clearToasts } from '../test/clearToasts'
import * as repository from '../data/campaignRepository'
import type { Campaign, CampaignRole } from '../types/campaign'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/campanhas') })
afterEach(clearToasts)
afterEach(() => vi.restoreAllMocks())
afterAll(() => vi.unstubAllGlobals())

function details(id: string, role: CampaignRole | null = 'manager') {
  render(<><CampaignDetailsPage campaignId={id} actorRole={role} /><FeedbackProvider /></>)
  return userEvent.setup()
}

async function confirm(label: string) {
  const modal = await screen.findByRole('alertdialog', { name: new RegExp(`^${label} `) })
  await userEvent.setup().click(within(modal).getByRole('button', { name: label }))
}

describe('Workflow de campanhas na UI', () => {
  it('a listagem não oferece submeter, aprovar, pausar nem encerrar', () => {
    render(<CampaignManagementPage campaigns={repository.getCampaigns()} />)
    expect(screen.queryByRole('button', { name: 'Submeter' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('cancelar confirmação não altera o status', async () => {
    const user = details('80')
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    const modal = await screen.findByRole('alertdialog', { name: /^Aprovar / })
    await user.click(within(modal).getByRole('button', { name: 'Cancelar' }))
    expect(repository.getCampaignById('80')?.status).toBe('pending')
    expect(screen.queryByRole('alertdialog', { name: /^Aprovar / })).not.toBeInTheDocument()
  })

  it('gestor aprova pendente e não pode aprovar novamente', async () => {
    const user = details('80')
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    await confirm('Aprovar')
    expect(await screen.findByText('Campanha aprovada.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Ativa')
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(repository.getCampaignById('80')?.status).toBe('active')
  })

  it.each(['Motivo da análise', ''])('gestor reprova com motivo opcional: %s', async reason => {
    const user = details('80')
    await user.click(screen.getByRole('button', { name: 'Reprovar' }))
    const input = await screen.findByRole('textbox', { name: 'Motivo da reprovação (opcional)' })
    if (reason) fireEvent.change(input, { target: { value: reason } })
    await confirm('Reprovar')
    expect(await screen.findByText('Campanha reprovada.')).toBeVisible()
    expect(repository.getCampaignById('80')).toMatchObject({ status: 'rejected', rejectionReason: reason })
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Reprovada')
    if (reason) expect(screen.getByText(reason)).toBeVisible()
  })

  it.each(['analyst', 'manager'] as const)('%s pausa ativa e encerra pausada com confirmação', async role => {
    const user = details('1', role)
    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    await confirm('Pausar')
    expect(await screen.findByText('Campanha pausada.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Pausada')
    expect(screen.queryByRole('button', { name: 'Retomar' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Encerrar' }))
    const modal = await screen.findByRole('alertdialog', { name: /^Encerrar / })
    expect(modal).toHaveTextContent('definitivamente')
    await user.click(within(modal).getByRole('button', { name: 'Encerrar' }))
    expect(await screen.findByText('Campanha encerrada.')).toBeVisible()
    expect(repository.getCampaignById('1')?.status).toBe('ended')
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('oculta ações de aprovação do analista e ações de papel desconhecido', async () => {
    const view = render(<CampaignDetailsPage campaignId="80" actorRole="analyst" />)
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reprovar' })).not.toBeInTheDocument()
    view.rerender(<CampaignDetailsPage campaignId="1" actorRole={null} />)
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('mantém status e modal abertos em falha, permitindo tentar novamente', async () => {
    const original = repository.performCampaignAction
    vi.spyOn(repository, 'performCampaignAction').mockImplementationOnce(request => original({ ...request, simulateFailure: true }))
    const user = details('80')
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    await confirm('Aprovar')
    expect(await screen.findByText('Não foi possível aprovar a campanha.')).toBeVisible()
    expect(repository.getCampaignById('80')?.status).toBe('pending')
    expect(screen.getByRole('alertdialog', { name: /^Aprovar / })).toBeVisible()
    await confirm('Aprovar')
    expect(await screen.findByText('Campanha aprovada.')).toBeVisible()
  })

  it('bloqueia confirmação duplicada e fechamento durante ação pendente', async () => {
    const original = repository.performCampaignAction
    let resolve!: (campaign: Campaign) => void
    const execute = vi.spyOn(repository, 'performCampaignAction').mockImplementation(() => new Promise(done => { resolve = done }))
    const user = details('80')
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    const modal = await screen.findByRole('alertdialog', { name: /^Aprovar / })
    await user.click(within(modal).getByRole('button', { name: 'Aprovar' }))
    expect(within(modal).getByRole('button', { name: 'Aprovar' })).toBeDisabled()
    expect(within(modal).getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(modal).toBeVisible()
    expect(execute).toHaveBeenCalledTimes(1)
    await act(async () => { resolve(await original(execute.mock.calls[0][0])) })
    await waitFor(() => expect(screen.queryByRole('alertdialog', { name: /^Aprovar / })).not.toBeInTheDocument())
  })

  it('a validação no repositório impede confirmar diálogo com status desatualizado', async () => {
    const user = details('80')
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))
    await act(async () => { await repository.performCampaignAction({ campaignId: '80', action: 'reject', role: 'manager' }) })
    await confirm('Aprovar')
    expect(await screen.findByText('Não foi possível aprovar a campanha.')).toBeVisible()
    expect(repository.getCampaignById('80')?.status).toBe('rejected')
  })
})
