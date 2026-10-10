import { Spinner } from '@heroui/react'
import './Loading.css'

export function Loading({ message = 'Carregando…' }: { message?: string }) {
  return <div className="ui-loading" role="status"><Spinner aria-hidden="true" /><span>{message}</span></div>
}
