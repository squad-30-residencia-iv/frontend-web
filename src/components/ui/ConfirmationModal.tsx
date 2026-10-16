import { Modal } from './Modal'

export type ConfirmationAction = 'delete' | 'activate' | 'deactivate' | 'approve'

export interface ConfirmationModalProps {
  action: ConfirmationAction
  itemName: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

const actionLabels = { delete: 'Excluir', activate: 'Ativar', deactivate: 'Inativar', approve: 'Aprovar' }

export function ConfirmationModal({ action, itemName, isOpen, onOpenChange, onConfirm, isPending = false }: ConfirmationModalProps) {
  const label = actionLabels[action]

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`${label} ${itemName}?`}
      role="alertdialog"
      isDismissable={false}
      isKeyboardDismissDisabled={isPending}
      secondaryAction={{ label: 'Cancelar', autoFocus: true, isDisabled: isPending, onPress: () => onOpenChange(false) }}
      primaryAction={{ label, variant: action === 'delete' ? 'danger' : 'primary', isPending, onPress: onConfirm }}
    >
      {action === 'delete' ? 'Esta ação não pode ser desfeita. Confirme para continuar.' : `Confirme para ${label.toLowerCase()} o item selecionado.`}
    </Modal>
  )
}

