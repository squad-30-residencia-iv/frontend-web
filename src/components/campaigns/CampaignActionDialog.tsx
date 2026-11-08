import { useEffect, useRef, useState } from 'react'
import { ConfirmationModal } from '../ui/ConfirmationModal'
import { Input } from '../ui/Input'
import { useFeedback } from '../ui/useFeedback'
import { performCampaignAction } from '../../data/campaignRepository'
import { campaignActionLabels, campaignActionMessages } from '../../data/campaignWorkflow'
import type { Campaign, CampaignAction, CampaignRole } from '../../types/campaign'

export interface SelectedCampaignAction {
  campaign: Pick<Campaign, 'id' | 'name'>
  action: CampaignAction
}

interface CampaignActionDialogProps {
  selected: SelectedCampaignAction | null
  role: CampaignRole | null
  onClose: () => void
  perform?: (input: { campaignId: string; action: CampaignAction; reason: string }) => Promise<void>
  descriptions?: Partial<Record<CampaignAction, string>>
}

const descriptions: Record<CampaignAction, string> = {
  submit: 'Enviar esta campanha para aprovação? Após o envio, somente o gestor poderá aprovar ou reprovar.',
  approve: 'A aprovação tornará esta campanha ativa. Confirme para continuar.',
  reject: 'Confirme a reprovação desta campanha. Você pode informar um motivo, se desejar.',
  pause: 'A campanha ficará pausada, interrompendo a emissão de novos vouchers.',
  end: 'Esta operação encerra a campanha definitivamente e interrompe a emissão de novos vouchers. Não há ação de reativação neste fluxo.',
}

export function CampaignActionDialog({ selected, role, onClose, perform, descriptions: descriptionOverrides }: CampaignActionDialogProps) {
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const feedback = useFeedback()
  useEffect(() => { setReason('') }, [selected?.campaign.id, selected?.action])

  async function confirm() {
    if (!selected || busy.current) return
    busy.current = true
    setPending(true)
    try {
      await (perform ?? (input => performCampaignAction({ campaignId: input.campaignId, action: input.action, role, reason: input.reason })))({
        campaignId: selected.campaign.id,
        action: selected.action,
        reason,
      })
      onClose()
      feedback.success({ title: campaignActionMessages[selected.action] })
    } catch (error) {
      feedback.error({
        title: `Não foi possível ${campaignActionLabels[selected.action].toLowerCase()} a campanha.`,
        description: error instanceof Error ? error.message : 'Tente novamente. O status anterior foi mantido.',
      })
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return <ConfirmationModal
    action={selected?.action ?? 'submit'}
    itemName={selected?.campaign.name ?? 'campanha'}
    isOpen={selected !== null}
    onOpenChange={isOpen => { if (!isOpen && !busy.current) onClose() }}
    onConfirm={confirm}
    isPending={pending}
    description={selected ? (descriptionOverrides?.[selected.action] ?? descriptions[selected.action]) : undefined}
  >
    {selected?.action === 'reject' && <Input
      label="Motivo da reprovação (opcional)"
      value={reason}
      onChange={setReason}
      isDisabled={pending}
    />}
  </ConfirmationModal>
}
