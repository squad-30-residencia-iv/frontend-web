import { beforeEach, describe, expect, it } from 'vitest'
import { getCampaignActions } from './campaignWorkflow'
import { campaignChangesStorageKey, getCampaignById, performCampaignAction } from './campaignRepository'
import type { CampaignAction, CampaignRole, CampaignStatus } from '../types/campaign'

beforeEach(() => localStorage.clear())

describe('Política de campanhas', () => {
  it.each([
    ['draft', 'analyst', ['submit']], ['draft', 'manager', []],
    ['pending', 'analyst', []], ['pending', 'manager', ['approve', 'reject']],
    ['active', 'analyst', ['pause', 'end']], ['active', 'manager', ['pause', 'end']],
    ['paused', 'analyst', ['end']], ['paused', 'manager', ['end']],
    ['scheduled', 'manager', []], ['ended', 'manager', []], ['rejected', 'analyst', []],
  ] satisfies [CampaignStatus, CampaignRole, CampaignAction[]][])('disponibiliza ações de %s para %s', (status, role, actions) => {
    expect(getCampaignActions(status, role)).toEqual(actions)
  })

  it('não concede ações a papel desconhecido', () => {
    expect(getCampaignActions('active', null)).toEqual([])
  })
})

describe('Transições centralizadas', () => {
  it('submete uma única vez e aprova, persistindo sem alterar o mock original', async () => {
    await performCampaignAction({ campaignId: '79', action: 'submit', role: 'analyst' })
    expect(getCampaignById('79')?.status).toBe('pending')
    await expect(performCampaignAction({ campaignId: '79', action: 'submit', role: 'analyst' })).rejects.toThrow('não é permitida')
    await performCampaignAction({ campaignId: '79', action: 'approve', role: 'manager' })
    expect(getCampaignById('79')?.status).toBe('active')
    expect(JSON.parse(localStorage.getItem(campaignChangesStorageKey)!)['79'].status).toBe('active')
  })

  it.each(['Motivo informado', '', '   '])('reprova com motivo opcional: %s', async reason => {
    await performCampaignAction({ campaignId: '80', action: 'reject', role: 'manager', reason })
    expect(getCampaignById('80')).toMatchObject({ status: 'rejected', rejectionReason: reason.trim() })
  })

  it.each(['analyst', 'manager'] as const)('permite pausar e encerrar com %s, sem retomada', async role => {
    await performCampaignAction({ campaignId: '1', action: 'pause', role })
    expect(getCampaignById('1')?.status).toBe('paused')
    await performCampaignAction({ campaignId: '1', action: 'end', role })
    expect(getCampaignById('1')?.status).toBe('ended')
    expect(getCampaignActions('ended', role)).toEqual([])
  })

  it('encerra diretamente uma campanha ativa', async () => {
    await performCampaignAction({ campaignId: '1', action: 'end', role: 'analyst' })
    expect(getCampaignById('1')?.status).toBe('ended')
  })

  it.each([
    ['1', 'approve', 'manager'], ['80', 'approve', 'analyst'], ['79', 'submit', 'manager'],
    ['3', 'pause', 'manager'], ['2', 'end', 'analyst'], ['1', 'pause', null],
  ] satisfies [string, CampaignAction, CampaignRole | null][])('recusa ação inválida %s/%s/%s sem gravar', async (campaignId, action, role) => {
    const previous = getCampaignById(campaignId)
    await expect(performCampaignAction({ campaignId, action, role })).rejects.toThrow('não é permitida')
    expect(getCampaignById(campaignId)).toEqual(previous)
    expect(localStorage.getItem(campaignChangesStorageKey)).toBeNull()
  })

  it('mantém o status em falha simulada e libera a campanha para nova tentativa', async () => {
    await expect(performCampaignAction({ campaignId: '80', action: 'approve', role: 'manager', simulateFailure: true })).rejects.toThrow('Falha simulada')
    expect(getCampaignById('80')?.status).toBe('pending')
    await performCampaignAction({ campaignId: '80', action: 'approve', role: 'manager' })
    expect(getCampaignById('80')?.status).toBe('active')
  })

  it('bloqueia ações concorrentes sobre a mesma campanha', async () => {
    const first = performCampaignAction({ campaignId: '1', action: 'pause', role: 'manager' })
    const duplicate = performCampaignAction({ campaignId: '1', action: 'end', role: 'manager' })
    await expect(duplicate).rejects.toThrow('em andamento')
    await first
    expect(getCampaignById('1')?.status).toBe('paused')
  })

  it('não sobrescreve persistência corrompida e recusa ID inexistente', async () => {
    await expect(performCampaignAction({ campaignId: 'inexistente', action: 'pause', role: 'manager' })).rejects.toThrow('não encontrada')
    localStorage.setItem(campaignChangesStorageKey, 'dados inválidos')
    await expect(performCampaignAction({ campaignId: '1', action: 'pause', role: 'manager' })).rejects.toThrow()
    expect(localStorage.getItem(campaignChangesStorageKey)).toBe('dados inválidos')
    expect(getCampaignById('1')?.status).toBe('active')
  })
})
