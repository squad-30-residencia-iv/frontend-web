import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'

export interface SecretRevealModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  clientSecret: string
  title: string
  /** Mensagem de alerta exibida abaixo do segredo. */
  warning: string
}

/**
 * Modal que exibe um segredo uma única vez, com ação de copiar.
 * Usado na criação da aplicação e na rotação de segredo.
 */
export function SecretRevealModal({ isOpen, onOpenChange, clientSecret, title, warning }: SecretRevealModalProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(clientSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: seleciona o texto para cópia manual
    }
  }

  function handleClose(open: boolean) {
    if (!open) setCopied(false)
    onOpenChange(open)
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleClose}
      title={title}
      isDismissable={false}
      primaryAction={{ label: 'Entendi', onPress: () => handleClose(false) }}
    >
      <div className="satellite-secret-reveal">
        <div className="satellite-secret-box">
          <code className="satellite-secret-value">{clientSecret}</code>
          <button
            type="button"
            className="satellite-secret-copy"
            onClick={handleCopy}
            aria-label={copied ? 'Copiado' : 'Copiar segredo'}
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
        <div className="satellite-secret-warning" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <p>{warning}</p>
        </div>
      </div>
    </Modal>
  )
}
