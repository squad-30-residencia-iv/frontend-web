import { Description, FieldError, Label, ListBox, Select as HeroSelect, type SelectProps as HeroSelectProps } from '@heroui/react'

function formatSelectedList(text: string) {
  return text.replace(/, and | and |, /g, ' + ')
}

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

export function Select<Mode extends 'single' | 'multiple' = 'single'>({
  label, options, description, errorMessage, isInvalid, className, selectionMode, ...props
}: SelectProps<Mode>) {
  return (
    <HeroSelect<SelectOption, Mode>
      {...props}
      selectionMode={selectionMode}
      className={[selectionMode === 'multiple' ? 'select--multiple' : '', className].filter(Boolean).join(' ') || undefined}
      isInvalid={isInvalid ?? Boolean(errorMessage)}
    >
      <Label>{label}</Label>
      <HeroSelect.Trigger>
        <HeroSelect.Value>
          {values => {
            if (values.isPlaceholder) return values.selectedText ?? ''
            const labels = values.selectedItems.flatMap(item => {
              if (!item || typeof item !== 'object' || !('textValue' in item) || typeof item.textValue !== 'string') return []
              return [item.textValue]
            })
            if (labels.length) return labels.join(' + ')
            return formatSelectedList(values.selectedText ?? '')
          }}
        </HeroSelect.Value>
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
