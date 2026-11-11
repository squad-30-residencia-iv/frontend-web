import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { satelliteNetworks, satelliteScopeOptions } from '../../data/satellite'
import type { CreateSatelliteAppPayload, SatelliteScope } from '../../types/satellite'

export interface CreateSatelliteFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (payload: CreateSatelliteAppPayload) => void
  isPending: boolean
  defaultNetworkId?: string
}

const networkOptions = satelliteNetworks.map(n => ({ value: n.id, label: n.name }))

interface FormErrors {
  name?: string
  clientId?: string
  networkId?: string
  scopes?: string
}

export function CreateSatelliteForm({
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
  defaultNetworkId = '',
}: CreateSatelliteFormProps) {
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [networkId, setNetworkId] = useState(defaultNetworkId)
  const [scopes, setScopes] = useState<Set<SatelliteScope>>(new Set(['voucher:redeem', 'voucher:read', 'campaign:read']))
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (isOpen) {
      setName('')
      setClientId('')
      setNetworkId(defaultNetworkId || (satelliteNetworks[0]?.id ?? ''))
      setScopes(new Set(['voucher:redeem', 'voucher:read', 'campaign:read']))
      setErrors({})
    }
  }, [isOpen, defaultNetworkId])

  function reset() {
    setName('')
    setClientId('')
    setNetworkId(defaultNetworkId)
    setScopes(new Set())
    setErrors({})
  }

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  function toggleScope(scope: SatelliteScope) {
    setScopes(current => {
      const next = new Set(current)
      if (next.has(scope)) {
        next.delete(scope)
      } else {
        next.add(scope)
      }
      return next
    })
  }

  function validate(): FormErrors {
    const result: FormErrors = {}
    if (!name.trim()) result.name = 'Nome da aplicação é obrigatório.'
    if (!clientId.trim()) result.clientId = 'Client ID é obrigatório.'
    if (!networkId) result.networkId = 'Selecione uma rede.'
    if (scopes.size === 0) result.scopes = 'Selecione ao menos um dos escopos.'
    return result
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSubmit({
      name: name.trim(),
      clientId: clientId.trim(),
      networkId,
      scopes: [...scopes],
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleClose}
      title="Nova aplicação satélite"
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      primaryAction={{
        label: 'Criar aplicação',
        isPending,
        onPress: () => {
          const form = document.getElementById('create-satellite-form') as HTMLFormElement | null
          form?.requestSubmit()
        },
      }}
      secondaryAction={{ label: 'Cancelar', isDisabled: isPending, onPress: () => handleClose(false) }}
    >
      <form id="create-satellite-form" onSubmit={handleSubmit} className="satellite-form" noValidate>
        <Input
          label="Nome da aplicação"
          placeholder="Ex.: PDV Loja Centro"
          value={name}
          onChange={setName}
          errorMessage={errors.name}
          isRequired
          isDisabled={isPending}
        />
        <Input
          label="Client ID"
          placeholder="Ex.: pdv-centro-001"
          value={clientId}
          onChange={setClientId}
          errorMessage={errors.clientId}
          isRequired
          isDisabled={isPending}
        />
        <Select
          label="Rede"
          options={networkOptions}
          selectedKey={networkId || null}
          onSelectionChange={key => setNetworkId(String(key))}
          errorMessage={errors.networkId}
          isRequired
          isDisabled={isPending}
          placeholder="Selecione a rede"
        />

        <fieldset className="satellite-scopes-group">
          <legend className="satellite-scopes-legend">
            Escopos da aplicação <span className="satellite-required">*</span>
          </legend>
          <div className="satellite-scopes-list">
            {satelliteScopeOptions.map(option => {
              const isChecked = scopes.has(option.value)
              return (
                <label key={option.value} className="satellite-scope-checkbox-label">
                  <input
                    type="checkbox"
                    className="satellite-scope-checkbox"
                    checked={isChecked}
                    onChange={() => toggleScope(option.value)}
                    disabled={isPending}
                  />
                  <div className="satellite-scope-info">
                    <strong className="satellite-scope-name">{option.label}</strong>
                    <code className="satellite-scope-code">{option.value}</code>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.scopes && <p className="satellite-field-error" role="alert">{errors.scopes}</p>}
        </fieldset>
      </form>
    </Modal>
  )
}
