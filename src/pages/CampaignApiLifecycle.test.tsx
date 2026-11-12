import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { CampaignDetailsPage } from './CampaignDetailsPage'
import { FeedbackProvider } from '../components/ui/FeedbackProvider'
import { clearToasts } from '../test/clearToasts'
import { api } from '../services/api'
import { decideCampaign, fetchCampaignDetails } from '../services/campaigns'
import { networkCampaigns } from '../mocks/handlers/campaigns'
import { server } from '../mocks/server'
import { generateMockJwt } from '../mocks/jwtUtils'
import type { CampaignRole } from '../types/campaign'

const id = '0199e3a0-0000-7000-8000-000000000111'
const networkId = '0199e3a0-0000-7000-8000-000000000001'
function authorize(role: 'analista' | 'gestor' | 'administrador', network: string | null = networkId) {
  api.defaults.headers.common.Authorization = `Bearer ${generateMockJwt({ id: 'user', name: 'Teste', email: 'teste@portal.dev', role, networkId: network })}`
}
function setup(role: CampaignRole | null = 'analyst') {
  if (role) authorize(role === 'analyst' ? 'analista' : 'gestor')
  render(<><CampaignDetailsPage campaignId={id} actorRole={role} /><FeedbackProvider /></>)
  return userEvent.setup()
}
async function confirmation(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await screen.findByRole('button', { name: label }))
  return screen.findByRole('alertdialog', { name: new RegExp(`^${label} `) })
}
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn() })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
})
beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-05T12:00:00Z')) })
afterAll(() => vi.unstubAllGlobals())
afterEach(async () => { delete api.defaults.headers.common.Authorization; await clearToasts(); vi.restoreAllMocks() })

describe('Ciclo da campanha pela API', () => {
  it.each(['analyst', 'manager'] as const)('%s pausa, recebe o status do servidor e encerra sem retomada', async role => {
    networkCampaigns[0].status = 'Active'
    const user = setup(role)
    let modal = await confirmation(user, 'Pausar')
    await user.click(within(modal).getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Campanha pausada.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Pausada')
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Retomar|Reativar/ })).not.toBeInTheDocument()
    expect((await fetchCampaignDetails(id))?.status).toBe('paused')
    modal = await confirmation(user, 'Encerrar')
    await user.click(within(modal).getByRole('button', { name: 'Encerrar' }))
    expect(await screen.findByText('Campanha encerrada.')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Encerrada')
    expect((await fetchCampaignDetails(id))?.status).toBe('ended')
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('cancela sem enviar o POST e permite encerrar diretamente a ativa', async () => {
    networkCampaigns[0].status = 'Active'
    const post = vi.spyOn(api, 'post')
    const user = setup()
    const modal = await confirmation(user, 'Pausar')
    await user.click(within(modal).getByRole('button', { name: 'Cancelar' }))
    expect(post).not.toHaveBeenCalled()
    expect(networkCampaigns[0].status).toBe('Active')
    const endModal = await confirmation(user, 'Encerrar')
    await user.click(within(endModal).getByRole('button', { name: 'Encerrar' }))
    expect(await screen.findByText('Campanha encerrada.')).toBeVisible()
    expect(post).toHaveBeenCalledWith(`/api/v1/campaigns/${id}/end`, undefined)
  })

  it.each(['Draft', 'PendingApproval', 'Scheduled', 'Ended', 'Rejected', 'Cancelled', 'SoldOut'])('não oferece pausa/encerramento em %s', async status => {
    networkCampaigns[0].status = status
    if (status === 'Scheduled') networkCampaigns[0].startsAt = '2026-10-06T08:00:00-03:00'
    setup()
    await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas' })
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('não oferece as ações para perfil sem permissão', async () => {
    networkCampaigns[0].status = 'Active'
    setup(null)
    await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas' })
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('mantém status e modal na falha e permite tentar novamente', async () => {
    networkCampaigns[0].status = 'Active'
    server.use(http.post('*/api/v1/campaigns/:id/pause', () => HttpResponse.json({ detail: 'Serviço indisponível.' }, { status: 503 })))
    const user = setup()
    const modal = await confirmation(user, 'Pausar')
    await user.click(within(modal).getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Serviço indisponível.')).toBeVisible()
    expect(screen.getByRole('alertdialog', { name: /^Pausar / })).toBeVisible()
    expect(networkCampaigns[0].status).toBe('Active')
    server.resetHandlers()
    await user.click(within(modal).getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Campanha pausada.')).toBeVisible()
  })

  it('bloqueia cliques repetidos e cancelamento durante o POST', async () => {
    networkCampaigns[0].status = 'Active'
    const user = setup()
    const modal = await confirmation(user, 'Pausar')
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const original = api.post.bind(api)
    const post = vi.spyOn(api, 'post').mockImplementation(async (...args) => { await gate; return original(...args) })
    const button = within(modal).getByRole('button', { name: 'Pausar' })
    try {
      fireEvent.click(button)
      fireEvent.click(button)
      await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
      expect(within(modal).getByRole('button', { name: 'Cancelar' })).toBeDisabled()
      expect(networkCampaigns[0].status).toBe('Active')
    } finally { release() }
    expect(await screen.findByText('Campanha pausada.')).toBeVisible()
  })

  it('recusa estado inválido, perfil e rede incompatíveis sem modificar o mock', async () => {
    authorize('analista')
    networkCampaigns[0].status = 'Draft'
    await expect(decideCampaign(id, 'pause')).rejects.toThrow('Somente uma campanha ativa')
    await expect(decideCampaign(id, 'end')).rejects.toThrow('Somente uma campanha ativa ou pausada')
    networkCampaigns[0].status = 'Active'
    authorize('administrador', null)
    await expect(decideCampaign(id, 'pause')).rejects.toThrow('Seu papel não permite')
    authorize('gestor', 'outra-rede')
    await expect(decideCampaign(id, 'end')).rejects.toThrow('Escopo organizacional')
    expect(networkCampaigns[0].status).toBe('Active')
  })

  it('mostra ativa e permite pausar a agendada cuja vigência já começou', async () => {
    networkCampaigns[0].status = 'Scheduled'
    const user = setup()
    await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas' })
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Ativa')
    expect(networkCampaigns[0].status).toBe('Scheduled')
    const modal = await confirmation(user, 'Pausar')
    await user.click(within(modal).getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Campanha pausada.')).toBeVisible()
    expect(networkCampaigns[0].status).toBe('Paused')
  })

  it.each(['Active', 'Paused'])('não oferece ações depois do minuto final, mesmo com %s gravado', async status => {
    vi.mocked(Date.now).mockReturnValue(Date.parse('2026-11-01T03:00:00Z'))
    networkCampaigns[0].status = status
    setup()
    await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas' })
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Encerrada')
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
    await expect(decideCampaign(id, 'end')).rejects.toThrow('Somente uma campanha ativa ou pausada')
    expect(networkCampaigns[0].status).toBe(status)
  })

  it('respeita o último segundo da vigência e a recusa se o prazo acaba com o modal aberto', async () => {
    networkCampaigns[0].status = 'Active'
    networkCampaigns[0].endsAt = '2026-10-05T09:59:00-03:00'
    vi.mocked(Date.now).mockReturnValue(Date.parse('2026-10-05T12:59:59Z'))
    const user = setup()
    await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas' })
    expect(screen.getByRole('region', { name: 'Vigência da campanha' })).toHaveTextContent('Em andamento')
    const modal = await confirmation(user, 'Pausar')
    vi.mocked(Date.now).mockReturnValue(Date.parse('2026-10-05T13:00:00Z'))
    await user.click(within(modal).getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Somente uma campanha ativa pode ser pausada.')).toBeVisible()
    expect(screen.getByRole('alertdialog', { name: /^Pausar / })).toBeVisible()
    expect((await fetchCampaignDetails(id))?.status).toBe('ended')
    expect(networkCampaigns[0].status).toBe('Active')
  })

  it('considera emitidos e reservas no esgotamento, conforme o backend local', async () => {
    networkCampaigns[0].status = 'Active'
    networkCampaigns[0].issuedVouchers = 50
    networkCampaigns[0].reservedVouchers = 50
    setup()
    await screen.findByRole('heading', { level: 2, name: 'Volta às Aulas' })
    expect(screen.getByRole('region', { name: 'Resumo da campanha' })).toHaveTextContent('Esgotada')
    expect(screen.getByRole('region', { name: 'Vigência da campanha' })).toHaveTextContent('A emissão de vouchers não está habilitada.')
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
    await expect(decideCampaign(id, 'pause')).rejects.toThrow('Somente uma campanha ativa')
    networkCampaigns[0].reservedVouchers = 0
    expect((await fetchCampaignDetails(id))?.status).toBe('active')
  })

  it('mantém os códigos HTTP de autenticação, papel e rede do backend local', async () => {
    networkCampaigns[0].status = 'Active'
    await expect(api.post(`/api/v1/campaigns/${id}/pause`)).rejects.toMatchObject({ response: { status: 401, data: { code: 'AUTH_UNAUTHENTICATED' } } })
    authorize('administrador', null)
    await expect(api.post(`/api/v1/campaigns/${id}/pause`)).rejects.toMatchObject({ response: { status: 403, data: { code: 'AUTH_FORBIDDEN_ROLE' } } })
    authorize('analista', 'outra-rede')
    await expect(api.post(`/api/v1/campaigns/${id}/pause`)).rejects.toMatchObject({ response: { status: 403, data: { code: 'SCOPE_FORBIDDEN' } } })
    expect(networkCampaigns[0].status).toBe('Active')
  })
})
