import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'

export const feedbackIcons = { success: CircleCheck, error: CircleX, warning: TriangleAlert, info: Info }
export type FeedbackType = keyof typeof feedbackIcons

export interface FeedbackMessage {
  title: string
  description?: string
  timeout?: number
}
