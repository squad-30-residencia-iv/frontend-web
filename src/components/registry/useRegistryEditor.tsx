import { useRef, useState } from 'react'
import { ConfirmationModal } from '../ui/ConfirmationModal'
import { useFeedback } from '../ui/useFeedback'
import { createRegistryItem, deactivateRegistryItem, updateRegistryItem } from '../../services/registry'
import type { RegistryEntity, RegistryFormValues, RegistryRow } from '../../types/registry'
import { RegistryFormModal, type RegistryFormRequest } from './RegistryFormModal'
import { emptyFormValues, outcomeMessage, registryCopy } from './registryCopy'

export interface RegistryEditorActions {
  openCreate: (entity: RegistryEntity, parentId: string | null, initial?: Partial<RegistryFormValues>, context?: string) => void
  openEdit: (entity: RegistryEntity, row: RegistryRow, context?: string) => void
  askDeactivate: (entity: RegistryEntity, row: RegistryRow) => void
  reactivate: (entity: RegistryEntity, row: RegistryRow) => void
}

interface DeactivateTarget {
  entity: RegistryEntity
  row: RegistryRow
}

const cascadeNotices: Partial<Record<RegistryEntity, string>> = {
  network: 'As regiões e lojas dela também ficaram inativas.',
  region: 'As lojas dela também ficaram inativas.',
  category: 'Os produtos dela também ficaram inativos.',
}

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Tente novamente.'
}

/** Formulário, confirmação e chamadas de gravação. Depois de gravar, chama `onChanged` para recarregar as listas. */
export function useRegistryEditor(onChanged: () => void) {
  const feedback = useFeedback()
  const [form, setForm] = useState<RegistryFormRequest | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [target, setTarget] = useState<DeactivateTarget | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)
  const busy = useRef(false)

  function openForm(request: RegistryFormRequest) {
    setFormError('')
    setForm(request)
  }

  const actions: RegistryEditorActions = {
    openCreate(entity, parentId, initial, context) {
      openForm({ entity, mode: 'create', row: null, parentId, initial: { ...emptyFormValues, ...initial }, context })
    },
    openEdit(entity, row, context) {
      openForm({ entity, mode: 'edit', row, parentId: null, initial: row.values, context })
    },
    askDeactivate(entity, row) {
      setTarget({ entity, row })
    },
    reactivate(entity, row) {
      void reactivate(entity, row)
    },
  }

  async function run(task: () => Promise<void>) {
    if (busy.current) return
    busy.current = true
    try {
      await task()
    } finally {
      busy.current = false
    }
  }

  async function submitForm(values: RegistryFormValues) {
    const request = form
    if (!request) return
    await run(async () => {
      setIsSaving(true)
      setFormError('')
      try {
        if (request.mode === 'create') {
          await createRegistryItem(request.entity, values, request.parentId)
        } else if (request.row) {
          // Editar mantém o status atual; inativar passa só pelo DELETE.
          await updateRegistryItem(request.entity, request.row.id, values, request.row.isActive)
        }
        setForm(null)
        feedback.success({ title: outcomeMessage(request.entity, request.mode === 'create' ? 'created' : 'updated') })
        onChanged()
      } catch (error) {
        setFormError(errorText(error))
      } finally {
        setIsSaving(false)
      }
    })
  }

  async function confirmDeactivate() {
    const current = target
    if (!current) return
    await run(async () => {
      setIsDeactivating(true)
      try {
        await deactivateRegistryItem(current.entity, current.row.id)
        setTarget(null)
        feedback.success({ title: outcomeMessage(current.entity, 'deactivated'), description: cascadeNotices[current.entity] })
        onChanged()
      } catch (error) {
        feedback.error({ title: `Não foi possível inativar ${articleNoun(current.entity)}.`, description: errorText(error) })
      } finally {
        setIsDeactivating(false)
      }
    })
  }

  async function reactivate(entity: RegistryEntity, row: RegistryRow) {
    await run(async () => {
      setReactivatingId(row.id)
      try {
        await updateRegistryItem(entity, row.id, row.values, true)
        feedback.success({ title: outcomeMessage(entity, 'reactivated') })
        onChanged()
      } catch (error) {
        feedback.error({ title: `Não foi possível reativar ${articleNoun(entity)}.`, description: errorText(error) })
      } finally {
        setReactivatingId(null)
      }
    })
  }

  const dialogs = <>
    <RegistryFormModal
      request={form}
      isPending={isSaving}
      errorMessage={formError}
      onSubmit={values => void submitForm(values)}
      onClose={() => setForm(null)}
    />
    <ConfirmationModal
      action="deactivate"
      itemName={target ? `${articleNoun(target.entity)} ${target.row.name}` : ''}
      isOpen={target !== null}
      onOpenChange={isOpen => { if (!isOpen && !busy.current) setTarget(null) }}
      onConfirm={() => void confirmDeactivate()}
      isPending={isDeactivating}
      description={target ? registryCopy[target.entity].deactivateWarning : undefined}
    />
  </>

  return { actions, reactivatingId, dialogs }
}

/** "a rede", "o produto". */
function articleNoun(entity: RegistryEntity) {
  const { noun, feminine } = registryCopy[entity]
  return `${feminine ? 'a' : 'o'} ${noun}`
}
