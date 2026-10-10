import { Button as HeroButton, Spinner, type ButtonProps as HeroButtonProps } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'

export type ButtonProps = HeroButtonProps & {
  startIcon?: LucideIcon
  endIcon?: LucideIcon
}

export function Button({ children, startIcon: StartIcon, endIcon: EndIcon, variant = 'primary', isPending, ...props }: ButtonProps) {
  return (
    <HeroButton {...props} variant={variant} isPending={isPending}>
      {(state) => (
        <>
          {isPending ? <Spinner size="sm" color="current" aria-hidden="true" /> : StartIcon && <StartIcon size={18} aria-hidden="true" />}
          {typeof children === 'function' ? children(state) : children}
          {EndIcon && <EndIcon size={18} aria-hidden="true" />}
        </>
      )}
    </HeroButton>
  )
}
