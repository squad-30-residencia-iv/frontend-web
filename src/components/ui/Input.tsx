import { Description, FieldError, Input as HeroInput, Label, TextField, type InputProps as HeroInputProps, type TextFieldProps } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import './Input.css'

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
      <div className={`ui-input-control${Icon ? ' ui-input-control--with-icon' : ''}`}>
        {Icon && <Icon className="ui-input-icon" size={18} aria-hidden="true" />}
        <HeroInput placeholder={placeholder} {...inputProps} />
      </div>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  )
}
