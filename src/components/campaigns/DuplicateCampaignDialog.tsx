import { useEffect, useState } from 'react'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useFeedback } from '../ui/useFeedback'
import { navigate } from '../../navigation/navigate'
import { duplicateCampaign } from '../../services/campaigns'
import './DuplicateCampaignDialog.css'

export interface DuplicableCampaign {
  id: string
  name: string
  startsAt: string
  endsAt: string
}

interface DuplicateCampaignDialogProps {
  campaign: DuplicableCampaign | null
  onClose: () => void
}

const maxNameLength = 150

/** D6: fora de rascunho a mecânica não muda; a cópia nasce em rascunho e abre na edição. */
export function DuplicateCampaignDialog({ campaign, onClose }: DuplicateCampaignDialogProps) {
  const feedback = useFeedback()
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!campaign) return
    setName(`Cópia de ${campaign.name}`.slice(0, maxNameLength))
    // A API devolve a hora local da rede com o offset; o campo usa só data e hora.
    setStart(campaign.startsAt.slice(0, 16))
    setEnd(campaign.endsAt.slice(0, 16))
  }, [campaign])

  async function confirm() {
    if (!campaign || pending) return
    setPending(true)
    try {
      const id = await duplicateCampaign(campaign.id, { name, startsAt: start, endsAt: end })
      onClose()
      feedback.success({ title: 'Campanha duplicada.', description: 'A cópia é um rascunho. Revise e salve para seguir.' })
      navigate(`/campanhas/${id}/editar`)
    } catch (error) {
      feedback.error({
        title: 'Não foi possível duplicar a campanha.',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setPending(false)
    }
  }

  return <Modal
    isOpen={campaign !== null}
    onOpenChange={isOpen => { if (!isOpen && !pending) onClose() }}
    title="Duplicar campanha"
    secondaryAction={{ label: 'Cancelar', onPress: onClose, isDisabled: pending }}
    primaryAction={{ label: 'Duplicar', onPress: confirm, isPending: pending }}
  >
    <p className="campaign-duplicate-description">
      Depois da aprovação a configuração não muda. A cópia nasce em rascunho, com alvos, quantidades, regras e escopo desta campanha.
    </p>
    <Input
      label="Nome da cópia"
      name="duplicateName"
      value={name}
      onChange={setName}
      isDisabled={pending}
      inputProps={{ maxLength: maxNameLength }}
    />
    <div className="campaign-duplicate-dates">
      <Input label="Início da vigência" name="duplicateStart" type="datetime-local" value={start} onChange={setStart} isDisabled={pending} />
      <Input label="Fim da vigência" name="duplicateEnd" type="datetime-local" value={end} onChange={setEnd} isDisabled={pending} />
    </div>
  </Modal>
}
