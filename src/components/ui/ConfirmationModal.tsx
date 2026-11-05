import { Modal } from './Modal'
import type { ReactNode } from 'react'

export type ConfirmationAction = 'delete' | 'activate' | 'deactivate' | 'approve' | 'submit' | 'reject' | 'pause' | 'end'

export interface ConfirmationModalProps {
  action: ConfirmationAction
  itemName: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onConfirm: () => void
  isPending?: boolean
  description?: ReactNode
  children?: ReactNode
}

const actionLabels = { delete: 'Excluir', activate: 'Ativar', deactivate: 'Inativar', approve: 'Aprovar', submit: 'Submeter', reject: 'Reprovar', pause: 'Pausar', end: 'Encerrar' }

export function ConfirmationModal({ action, itemName, isOpen, onOpenChange, onConfirm, isPending = false, description, children }: ConfirmationModalProps) {
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
      primaryAction={{ label, variant: ['delete', 'reject', 'end'].includes(action) ? 'danger' : 'primary', isPending, isDisabled: isPending, onPress: onConfirm }}
    >
      {description ?? (action === 'delete' ? 'Esta ação não pode ser desfeita. Confirme para continuar.' : `Confirme para ${label.toLowerCase()} o item selecionado.`)}
      {children}
    </Modal>
  )
}

