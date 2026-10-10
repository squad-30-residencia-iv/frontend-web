import { Spinner } from '@heroui/react'

export function Loading({ message = 'Carregando…' }: { message?: string }) {
  return <div className="flex items-center justify-center gap-3 p-6" role="status"><Spinner aria-hidden="true" /><span>{message}</span></div>
}
