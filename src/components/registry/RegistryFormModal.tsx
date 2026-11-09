import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { FeedbackAlert } from '../ui/FeedbackAlert'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { storeChannels, type RegistryEntity, type RegistryFormValues, type RegistryRow, type StoreChannel } from '../../types/registry'
import { channelLabels, newLabel, registryCopy } from './registryCopy'
import './RegistryFormModal.css'

export interface RegistryFormRequest {
  entity: RegistryEntity
  mode: 'create' | 'edit'
  /** Cadastro em edição. Nulo ao criar. */
  row: RegistryRow | null
  /** Pai do novo cadastro (rede, região ou categoria). */
  parentId: string | null
  initial: RegistryFormValues
  /** Pai exibido no topo, ex.: "Região: Sudeste". */
  context?: string
}

type FieldName = 'name' | 'code' | 'timeZone' | 'channels'
type FieldErrors = Partial<Record<FieldName, string>>

const nameMaxLength = 150
const timeZoneMaxLength = 64
const codeMaxLength: Partial<Record<RegistryEntity, number>> = { store: 20, product: 30 }

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value })
    return true
  } catch {
    return false
  }
}

function validate(entity: RegistryEntity, values: RegistryFormValues): FieldErrors {
  const { noun, feminine } = registryCopy[entity]
  const of = feminine ? 'da' : 'do'
  const errors: FieldErrors = {}
  const name = values.name.trim()
  const code = values.code.trim()
  const timeZone = values.timeZone.trim()
  const maxCode = codeMaxLength[entity]

  if (!name) errors.name = `Informe o nome ${of} ${noun}.`
  else if (name.length > nameMaxLength) errors.name = `O nome deve ter no máximo ${nameMaxLength} caracteres.`

  if (maxCode !== undefined) {
    if (!code) errors.code = `Informe o código ${of} ${noun}.`
    else if (code.length > maxCode) errors.code = `O código deve ter no máximo ${maxCode} caracteres.`
  }

  if (entity === 'network') {
    if (!timeZone) errors.timeZone = 'Informe o fuso da rede.'
    else if (timeZone.length > timeZoneMaxLength) errors.timeZone = `O fuso deve ter no máximo ${timeZoneMaxLength} caracteres.`
    else if (!isValidTimeZone(timeZone)) errors.timeZone = 'Informe um fuso IANA válido, como America/Sao_Paulo.'
  }

  if (entity === 'store' && values.channels.length === 0) errors.channels = 'Escolha ao menos um canal.'

  return errors
}

interface RegistryFormModalProps {
  request: RegistryFormRequest | null
  isPending: boolean
  /** Recusa da API, mostrada dentro do modal. */
  errorMessage: string
  onSubmit: (values: RegistryFormValues) => void
  onClose: () => void
}

export function RegistryFormModal({ request, isPending, errorMessage, onSubmit, onClose }: RegistryFormModalProps) {
  const formId = useId()
  const channelsErrorId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<RegistryFormValues>(request?.initial ?? { name: '', code: '', timeZone: '', channels: [] })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (!request) return
    setValues(request.initial)
    setErrors({})
  }, [request])

  // Depois de uma validação com erro, leva o foco ao primeiro campo inválido.
  useEffect(() => {
    if (focusRequest === 0) return
    formRef.current?.querySelector<HTMLElement>('input[aria-invalid="true"], fieldset[aria-invalid="true"] input')?.focus()
  }, [focusRequest])

  const entity = request?.entity ?? 'network'
  const copy = registryCopy[entity]
  const maxCode = codeMaxLength[entity]
  const title = request?.mode === 'edit' ? `Editar ${copy.noun}` : newLabel(entity)

  function update<K extends keyof RegistryFormValues>(field: K, value: RegistryFormValues[K]) {
    setValues(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
  }

  function toggleChannel(channel: StoreChannel) {
    const next = values.channels.includes(channel)
      ? values.channels.filter(item => item !== channel)
      : [...values.channels, channel]
    update('channels', storeChannels.filter(item => next.includes(item)))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!request || isPending) return
    const nextErrors = validate(request.entity, values)
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      setFocusRequest(current => current + 1)
      return
    }
    onSubmit(values)
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
      label: request?.mode === 'edit' ? 'Salvar alterações' : 'Cadastrar',
      type: 'submit',
      form: formId,
      isPending,
      isDisabled: isPending,
    }}
  >
    <form id={formId} ref={formRef} className="registry-form" noValidate onSubmit={handleSubmit}>
      {request?.context && <p className="registry-form-context">{request.context}</p>}
      {request?.row && !request.row.isActive && <p className="registry-form-note">
        Este cadastro está inativo e continua assim ao salvar. Para reativar, use "Reativar" na lista.
      </p>}
      {errorMessage && <FeedbackAlert type="error" title="Não foi possível salvar." description={errorMessage} />}

      {maxCode !== undefined && <Input
        label="Código"
        value={values.code}
        onChange={value => update('code', value)}
        maxLength={maxCode}
        isRequired
        validationBehavior="aria"
        autoFocus
        isDisabled={isPending}
        errorMessage={errors.code}
        description={`Até ${maxCode} caracteres.`}
      />}
      <Input
        label="Nome"
        value={values.name}
        onChange={value => update('name', value)}
        maxLength={nameMaxLength}
        isRequired
        validationBehavior="aria"
        autoFocus={maxCode === undefined}
        isDisabled={isPending}
        errorMessage={errors.name}
      />
      {entity === 'network' && <Input
        label="Fuso horário"
        value={values.timeZone}
        onChange={value => update('timeZone', value)}
        maxLength={timeZoneMaxLength}
        isRequired
        validationBehavior="aria"
        isDisabled={isPending}
        errorMessage={errors.timeZone}
        description="Fuso IANA usado nas datas das campanhas, como America/Sao_Paulo."
      />}
      {entity === 'store' && <fieldset
        className="registry-form-channels"
        aria-invalid={Boolean(errors.channels)}
        aria-describedby={errors.channels ? channelsErrorId : undefined}
        disabled={isPending}
      >
        <legend>Canais</legend>
        <div className="registry-form-channel-options">
          {storeChannels.map(channel => <label className="registry-form-option" key={channel}>
            <input
              type="checkbox"
              name="channels"
              value={channel}
              checked={values.channels.includes(channel)}
              onChange={() => toggleChannel(channel)}
            />
            {channelLabels[channel]}
          </label>)}
        </div>
        {errors.channels && <p id={channelsErrorId} className="registry-form-error" role="alert">{errors.channels}</p>}
      </fieldset>}
    </form>
  </Modal>
}
