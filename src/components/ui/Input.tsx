import { Description, FieldError, Input as HeroInput, Label, TextField, type InputProps as HeroInputProps, type TextFieldProps } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface InputProps extends Omit<TextFieldProps, 'children'> {
  label: string
  placeholder?: string
  description?: ReactNode
  errorMessage?: string
  icon?: LucideIcon
  inputProps?: HeroInputProps
}

export function Input({ label, placeholder, description, errorMessage, icon: Icon, inputProps, isInvalid, ...props }: InputProps) {
  return (
    <TextField {...props} isInvalid={isInvalid ?? Boolean(errorMessage)}>
      <Label>{label}</Label>
      <div className="relative w-full">
        {Icon && <Icon className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden="true" />}
        <HeroInput placeholder={placeholder} {...inputProps} className={[Icon ? 'ps-10' : '', 'w-full', inputProps?.className].filter(Boolean).join(' ')} />
      </div>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  )
}
