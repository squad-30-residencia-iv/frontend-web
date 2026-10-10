import { Modal as HeroModal, type ModalBackdropProps } from '@heroui/react'
import type { ReactNode } from 'react'
import { Button, type ButtonProps } from './Button'

export interface ModalAction extends Omit<ButtonProps, 'children'> {
  label: string
}

export interface ModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
  primaryAction?: ModalAction
  secondaryAction?: ModalAction
  isDismissable?: ModalBackdropProps['isDismissable']
  isKeyboardDismissDisabled?: boolean
  role?: 'dialog' | 'alertdialog'
}

export function Modal({ isOpen, onOpenChange, title, children, footer, primaryAction, secondaryAction, isDismissable = true, isKeyboardDismissDisabled = false, role = 'dialog' }: ModalProps) {
  return (
    <HeroModal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={isDismissable} isKeyboardDismissDisabled={isKeyboardDismissDisabled}>
      <HeroModal.Container>
        <HeroModal.Dialog role={role}>
          <HeroModal.CloseTrigger aria-label="Fechar modal" isDisabled={isKeyboardDismissDisabled} />
          <HeroModal.Header><HeroModal.Heading>{title}</HeroModal.Heading></HeroModal.Header>
          <HeroModal.Body>{children}</HeroModal.Body>
          {(footer || primaryAction || secondaryAction) && (
            <HeroModal.Footer>
              {footer}
              {secondaryAction && <ActionButton variant="secondary" {...secondaryAction} />}
              {primaryAction && <ActionButton {...primaryAction} />}
            </HeroModal.Footer>
          )}
        </HeroModal.Dialog>
      </HeroModal.Container>
    </HeroModal.Backdrop>
  )
}

function ActionButton({ label, ...props }: ModalAction) {
  return <Button {...props}>{label}</Button>
}
