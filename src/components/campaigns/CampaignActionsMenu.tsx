import { Dropdown } from '@heroui/react'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Campaign } from '../../types/campaign'
import type { CampaignAction, CampaignRole } from '../../types/campaign'
import { campaignActionLabels, getCampaignActions } from '../../data/campaignWorkflow'
import { currentUser } from '../../data/currentUser'

interface CampaignActionsMenuProps {
  campaign: Pick<Campaign, 'name'> & Partial<Pick<Campaign, 'id' | 'status'>>
  role?: CampaignRole | null
  onAction?: (action: CampaignAction) => void
}

export function CampaignActionsMenu({ campaign, role = currentUser.campaignRole ?? null, onAction }: CampaignActionsMenuProps) {
  const actions = campaign.id && campaign.status && onAction ? getCampaignActions(campaign.status, role) : []
  return <Dropdown>
    <Button variant="ghost" isIconOnly aria-label={`Ações de ${campaign.name}`} className="campaign-actions" startIcon={EllipsisVertical} />
    <Dropdown.Popover>
      <Dropdown.Menu aria-label={`Ações de ${campaign.name}`}>
        {actions.length ? actions.map(action => <Dropdown.Item
          key={action}
          id={action}
          textValue={campaignActionLabels[action]}
          onAction={() => onAction?.(action)}
        >{campaignActionLabels[action]}</Dropdown.Item>) : <Dropdown.Item id="unavailable" isDisabled textValue="Sem ações disponíveis">
          Nenhuma ação disponível para este perfil e status
        </Dropdown.Item>}
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
}

