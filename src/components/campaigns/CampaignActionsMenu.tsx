import { Dropdown } from '@heroui/react'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Campaign } from '../../types/campaign'
export function CampaignActionsMenu({ campaign }: { campaign: Pick<Campaign, 'name'> }) {
  return <Dropdown><Button variant="ghost" isIconOnly aria-label={`Ações de ${campaign.name}`} className="campaign-actions" startIcon={EllipsisVertical} /><Dropdown.Popover><Dropdown.Menu aria-label={`Ações de ${campaign.name}`}><Dropdown.Item id="pending" isDisabled textValue="Ações em breve">Ações disponíveis na próxima etapa</Dropdown.Item></Dropdown.Menu></Dropdown.Popover></Dropdown>
}

