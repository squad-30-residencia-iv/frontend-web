import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { storeChannels, type StoreChannel } from '../../types/registry'
import {
  codeMaxForKind,
  parseRegistryImportLines,
  type RegistryImportKind,
  type RegistryImportLine,
} from '../../data/registryImport'
import { FeedbackAlert } from '../ui/FeedbackAlert'
import { Modal } from '../ui/Modal'
import { channelLabels, registryCopy } from './registryCopy'
import './RegistryFormModal.css'
import './RegistryImportModal.css'

export interface RegistryImportRequest {
  kind: RegistryImportKind
  parentId: string
  context?: string
}

interface RegistryImportModalProps {
  request: RegistryImportRequest | null
  isPending: boolean
  errorMessage: string
  onSubmit: (lines: RegistryImportLine[], channels: StoreChannel[]) => void
  onClose: () => void
}

export function RegistryImportModal({ request, isPending, errorMessage, onSubmit, onClose }: RegistryImportModalProps) {
  const formId = useId()
  const listId = useId()
  const listErrorId = useId()
  const channelsErrorId = useId()
  const listRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')
  const [channels, setChannels] = useState<StoreChannel[]>([])
  const [listError, setListError] = useState('')
  const [channelsError, setChannelsError] = useState('')
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (!request) return
    setText('')
    setChannels([])
    setListError('')
    setChannelsError('')
  }, [request])

  useEffect(() => {
    if (focusRequest === 0) return
    if (channelsError) {
      listRef.current?.form?.querySelector<HTMLElement>('fieldset[aria-invalid="true"] input')?.focus()
      return
    }
    listRef.current?.focus()
  }, [focusRequest, channelsError])

  const kind = request?.kind ?? 'product'
  const copy = registryCopy[kind]
  const title = `Importar ${copy.plural.toLowerCase()} em lote`

  function toggleChannel(channel: StoreChannel) {
    const next = channels.includes(channel)
      ? channels.filter(item => item !== channel)
      : [...channels, channel]
    setChannels(storeChannels.filter(item => next.includes(item)))
    setChannelsError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!request || isPending) return
    const parsed = parseRegistryImportLines(text, { codeMax: codeMaxForKind(request.kind) })
    const nextListError = 'error' in parsed ? parsed.error : ''
    const nextChannelsError = request.kind === 'store' && channels.length === 0 ? 'Escolha ao menos um canal.' : ''
    setListError(nextListError)
    setChannelsError(nextChannelsError)
    if (nextListError || nextChannelsError || !('lines' in parsed)) {
      setFocusRequest(current => current + 1)
      return
    }
    onSubmit(parsed.lines, channels)
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !isPending) onClose()
  }

  return <Modal
    isOpen={request !== null}
    onOpenChange={handleOpenChange}
    title={title}
    isDismissable={!isPending}
    isKeyboardDismissDisabled={isPending}
    secondaryAction={{ label: 'Cancelar', isDisabled: isPending, onPress: () => handleOpenChange(false) }}
    primaryAction={{
      label: 'Importar',
      type: 'submit',
      form: formId,
      isPending,
      isDisabled: isPending,
    }}
  >
    <form id={formId} className="registry-form" noValidate onSubmit={handleSubmit}>
      {request?.context && <p className="registry-form-context">{request.context}</p>}
      {errorMessage && <FeedbackAlert type="error" title="Não foi possível importar." description={errorMessage} />}

      {kind === 'store' && <fieldset
        className="registry-form-channels"
        aria-invalid={Boolean(channelsError)}
        aria-describedby={channelsError ? channelsErrorId : undefined}
        disabled={isPending}
      >
        <legend>Canais</legend>
        <div className="registry-form-channel-options">
          {storeChannels.map(channel => <label className="registry-form-option" key={channel}>
            <input
              type="checkbox"
              name="channels"
              value={channel}
              checked={channels.includes(channel)}
              onChange={() => toggleChannel(channel)}
            />
            {channelLabels[channel]}
          </label>)}
        </div>
        {channelsError && <p id={channelsErrorId} className="registry-form-error" role="alert">{channelsError}</p>}
      </fieldset>}

      <div className="registry-import-field">
        <label htmlFor={listId}>Lista</label>
        <textarea
          id={listId}
          ref={listRef}
          className="registry-import-list"
          value={text}
          onChange={event => {
            setText(event.target.value)
            setListError('')
          }}
          rows={8}
          required
          disabled={isPending}
          autoFocus
          aria-invalid={Boolean(listError)}
          aria-describedby={listError ? listErrorId : undefined}
          placeholder={'COD-1 — Nome do item'}
        />
        <p className="registry-import-hint">
          Uma linha por {copy.noun}: código e nome separados por traço, vírgula, ponto e vírgula ou tab. Até 1.000 linhas.
        </p>
        {listError && <p id={listErrorId} className="registry-form-error" role="alert">{listError}</p>}
      </div>
    </form>
  </Modal>
}
