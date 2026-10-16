import { Description, FieldError, Label, ListBox, Select as HeroSelect, type SelectProps as HeroSelectProps } from '@heroui/react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps<Mode extends 'single' | 'multiple' = 'single'> extends Omit<HeroSelectProps<SelectOption, Mode>, 'children' | 'items'> {
  label: string
  options: readonly SelectOption[]
  description?: string
  errorMessage?: string
}

export function Select<Mode extends 'single' | 'multiple' = 'single'>({ label, options, description, errorMessage, isInvalid, ...props }: SelectProps<Mode>) {
  return (
    <HeroSelect<SelectOption, Mode> {...props} isInvalid={isInvalid ?? Boolean(errorMessage)}>
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
