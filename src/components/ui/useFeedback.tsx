import { toast } from '@heroui/react'
import { feedbackIcons, type FeedbackMessage, type FeedbackType } from './feedback'

function showFeedback(type: FeedbackType, { title, description, timeout }: FeedbackMessage) {
  const Icon = feedbackIcons[type]
  const notify = type === 'error' ? toast.danger : toast[type]
  return notify(title, { description, timeout, indicator: <Icon size={20} aria-hidden="true" /> })
}

const feedback = {
  success: (message: FeedbackMessage) => showFeedback('success', message),
  error: (message: FeedbackMessage) => showFeedback('error', message),
  warning: (message: FeedbackMessage) => showFeedback('warning', message),
  info: (message: FeedbackMessage) => showFeedback('info', message),
  dismiss: toast.close,
}

export function useFeedback() {
  return feedback
}
