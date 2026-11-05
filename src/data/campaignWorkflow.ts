import type { CampaignAction, CampaignRole, CampaignStatus } from '../types/campaign'

export const campaignActionLabels: Record<CampaignAction, string> = {
  submit: 'Submeter', approve: 'Aprovar', reject: 'Reprovar', pause: 'Pausar', end: 'Encerrar',
}

export const campaignActionMessages: Record<CampaignAction, string> = {
  submit: 'Campanha enviada para aprovação.',
  approve: 'Campanha aprovada.',
  reject: 'Campanha reprovada.',
  pause: 'Campanha pausada.',
  end: 'Campanha encerrada.',
}

interface Transition {
  from: readonly CampaignStatus[]
  to: CampaignStatus
  roles: readonly CampaignRole[]
}

// Matriz única usada tanto na UI quanto na validação das mutações do repositório.
export const campaignTransitions: Record<CampaignAction, Transition> = {
  submit: { from: ['draft'], to: 'pending', roles: ['analyst'] },
  approve: { from: ['pending'], to: 'active', roles: ['manager'] },
  reject: { from: ['pending'], to: 'rejected', roles: ['manager'] },
  pause: { from: ['active'], to: 'paused', roles: ['analyst', 'manager'] },
  end: { from: ['active', 'paused'], to: 'ended', roles: ['analyst', 'manager'] },
}

export function getCampaignActions(status: CampaignStatus, role: CampaignRole | null): CampaignAction[] {
  if (!role) return []
  return (Object.keys(campaignTransitions) as CampaignAction[]).filter(action => {
    const transition = campaignTransitions[action]
    return transition.from.includes(status) && transition.roles.includes(role)
  })
}
