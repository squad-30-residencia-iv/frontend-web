import { Description, FieldError, Label, ListBox, Select as HeroSelect, type SelectProps as HeroSelectProps } from '@heroui/react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<HeroSelectProps<SelectOption>, 'children' | 'items'> {
  label: string
  options: readonly SelectOption[]
  description?: string
  errorMessage?: string
}

export function Select({ label, options, description, errorMessage, isInvalid, ...props }: SelectProps) {
  return (
    <HeroSelect {...props} isInvalid={isInvalid ?? Boolean(errorMessage)}>
      <Label>{label}</Label>
      <HeroSelect.Trigger>
        <HeroSelect.Value />
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover>
        <ListBox items={options}>
          {(option) => <ListBox.Item id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>}
        </ListBox>
      </HeroSelect.Popover>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </HeroSelect>
  )
}
