import { Alert } from '@heroui/react'
import { feedbackIcons, type FeedbackType } from './feedback'

export interface FeedbackAlertProps {
  type: FeedbackType
  title: string
  description?: string
}

export function FeedbackAlert({ type, title, description }: FeedbackAlertProps) {
  const Icon = feedbackIcons[type]

  return (
    <Alert status={type === 'error' ? 'danger' : type === 'info' ? 'accent' : type} role={type === 'error' || type === 'warning' ? 'alert' : 'status'}>
      <Alert.Indicator><Icon size={20} aria-hidden="true" /></Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {description && <Alert.Description>{description}</Alert.Description>}
      </Alert.Content>
    </Alert>
  )
}
