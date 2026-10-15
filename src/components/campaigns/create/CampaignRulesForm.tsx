import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import type { CampaignCondition, CampaignDraft, CampaignRestriction } from '../../../types/campaign'
import {
  conditionFieldName,
  restrictionFieldName,
  type CampaignRulesErrors,
} from '../../../data/campaignRules'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { useFeedback } from '../../ui/useFeedback'
import './CampaignRulesForm.css'

type Rules = CampaignDraft['rules']
interface CampaignRulesFormProps {
  value: Rules
  errors: CampaignRulesErrors
  onChange: (value: Rules) => void
}
interface MoneyFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  errorMessage?: string
  placeholder?: string
  isRequired?: boolean
}

function MoneyField({ placeholder, ...props }: MoneyFieldProps) {
  const showCurrency = Boolean(props.value.trim()) || !placeholder
  return <div className={`campaign-rules-money ${showCurrency ? 'campaign-rules-money-prefixed' : ''}`}>
    <Input
      {...props}
      placeholder={placeholder}
      validationBehavior="aria"
      inputProps={{ inputMode: 'decimal' }}
    />
    {showCurrency && <span className="campaign-rules-currency" aria-hidden="true">R$</span>}
  </div>
}

export function CampaignRulesForm({ value, errors, onChange }: CampaignRulesFormProps) {
  const feedback = useFeedback()
  const [conditionToDelete, setConditionToDelete] = useState<string | null>(null)
  const addConditionRef = useRef<HTMLButtonElement>(null)
  const previousCount = useRef(value.conditions.length)

  useEffect(() => {
    if (value.conditions.length < previousCount.current) addConditionRef.current?.focus()
    previousCount.current = value.conditions.length
  }, [value.conditions.length])

  function deleteCondition(id: string) {
    onChange({ ...value, conditions: value.conditions.filter(item => item.id !== id) })
    setConditionToDelete(null)
    feedback.success({ title: 'Condição excluída do rascunho.' })
  }

  function requestDeleteCondition(condition: CampaignCondition) {
    if (condition.value.trim()) setConditionToDelete(condition.id)
    else deleteCondition(condition.id)
  }
  const deleteIndex = value.conditions.findIndex(item => item.id === conditionToDelete)

  function updateCondition(id: string, changes: Partial<Omit<CampaignCondition, 'id'>>) {
    onChange({ ...value, conditions: value.conditions.map(item => item.id === id ? { ...item, ...changes } : item) })
  }

  function updateRestriction(id: string, changes: Partial<Omit<CampaignRestriction, 'id'>>) {
    onChange({ ...value, restrictions: value.restrictions.map(item => item.id === id ? { ...item, ...changes } : item) })
  }
  return <section className="create-campaign-information campaign-rules" aria-labelledby="campaign-rules-title">
    <h2 id="campaign-rules-title" tabIndex={-1}>Regras e público</h2>
    <Select
      label="Público elegível"
      name="audience"
      options={[{ value: 'all', label: 'Todos os clientes' }]}
      value={value.audience || null}
      onChange={next => onChange({ ...value, audience: next === 'all' ? 'all' : '' })}
      isRequired
      validationBehavior="aria"
      errorMessage={errors.audience}
    />
    <p className="campaign-rules-description">Condições para geração do voucher</p>
    <fieldset className="campaign-rules-choice">
      <legend>O cliente deverá atender:</legend>
      <label>
        <input
          type="radio"
          name="conditionMatch"
          value="all"
          checked={value.conditionMatch === 'all'}
          onChange={() => onChange({ ...value, conditionMatch: 'all' })}
        />Todas as condições - E
      </label>
      <label>
        <input
          type="radio"
          name="conditionMatch"
          value="any"
          checked={value.conditionMatch === 'any'}
          onChange={() => onChange({ ...value, conditionMatch: 'any' })}
        />Pelo menos uma condição - OU
      </label>
    </fieldset>
    <section className="campaign-rules-panel" aria-labelledby="campaign-conditions-title">
      <h3 id="campaign-conditions-title">Condições</h3>
      <p>Adicione um card para cada condição</p>
      {value.conditions.map((condition, index) => <fieldset className="campaign-rules-item" key={condition.id}>
        <legend>Condição {' '}
          {index + 1}:
        </legend>
        <div className="campaign-rules-fields">
          <Select
            label="Tipo de condição"
            name={conditionFieldName(condition.id, 'type')}
            options={[{ value: 'purchase-total', label: 'Valor total da compra' }]}
            value={condition.type || null}
            onChange={next => updateCondition(condition.id, { type: next === 'purchase-total' ? 'purchase-total' : '' })}
            isRequired
            validationBehavior="aria"
            errorMessage={errors[conditionFieldName(condition.id, 'type')]}
          />
          <Select
            label="Operador"
            name={conditionFieldName(condition.id, 'operator')}
            options={[{ value: 'gte', label: 'Maior ou igual a' }]}
            value={condition.operator || null}
            onChange={next => updateCondition(condition.id, { operator: next === 'gte' ? 'gte' : '' })}
            isRequired
            validationBehavior="aria"
            errorMessage={errors[conditionFieldName(condition.id, 'operator')]}
          />
          <MoneyField
            label="Valor"
            name={conditionFieldName(condition.id, 'value')}
            value={condition.value}
            onChange={next => updateCondition(condition.id, { value: next })}
            isRequired
            errorMessage={errors[conditionFieldName(condition.id, 'value')]}
          />
        </div>
        <Button
          className="campaign-rules-delete"
          type="button"
          variant="ghost"
          startIcon={Trash2}
          aria-label={`Excluir condição ${index + 1}`}
          onPress={() => requestDeleteCondition(condition)}
        >Excluir condição</Button>
      </fieldset>)}
      <Button
        ref={addConditionRef}
        type="button"
        variant="secondary"
        onPress={() => onChange({ ...value, conditions: [...value.conditions, { id: crypto.randomUUID(), type: 'purchase-total', operator: 'gte', value: '' }] })}
      >Adicionar condição +</Button>
    </section>
    <fieldset className="campaign-rules-choice">
      <legend>A compra deverá atender:</legend>
      <label>
        <input
          type="radio"
          name="restrictionMatch"
          value="all"
          checked={value.restrictionMatch === 'all'}
          onChange={() => onChange({ ...value, restrictionMatch: 'all' })}
        />Todas as restrições — E
      </label>
      <label>
        <input
          type="radio"
          name="restrictionMatch"
          value="any"
          checked={value.restrictionMatch === 'any'}
          onChange={() => onChange({ ...value, restrictionMatch: 'any' })}
        />Pelo menos uma restrição — OU
      </label>
    </fieldset>
    <section className="campaign-rules-panel" aria-labelledby="campaign-restrictions-title">
      <h3 id="campaign-restrictions-title">Restrições</h3>
      <p>Adicione um card para cada restrição</p>
      {value.restrictions.map((restriction, index) => <fieldset className="campaign-rules-item" key={restriction.id}>
        <legend>Restrição {' '}
          {index + 1}:
        </legend>
        <div className="campaign-rules-fields">
          <Select
            label="Tipo de restrição"
            name={restrictionFieldName(restriction.id, 'type')}
            options={[{ value: 'purchase-value', label: 'Valor da compra' }]}
            value={restriction.type || null}
            onChange={next => updateRestriction(restriction.id, { type: next === 'purchase-value' ? 'purchase-value' : '' })}
            isRequired
            validationBehavior="aria"
            errorMessage={errors[restrictionFieldName(restriction.id, 'type')]}
          />
          <MoneyField
            label="Mínimo"
            name={restrictionFieldName(restriction.id, 'minimum')}
            value={restriction.minimum}
            onChange={next => updateRestriction(restriction.id, { minimum: next })}
            isRequired
            errorMessage={errors[restrictionFieldName(restriction.id, 'minimum')]}
          />
          <MoneyField
            label="Máximo"
            name={restrictionFieldName(restriction.id, 'maximum')}
            placeholder="Sem limite"
            value={restriction.maximum}
            onChange={next => updateRestriction(restriction.id, { maximum: next })}
            errorMessage={errors[restrictionFieldName(restriction.id, 'maximum')]}
          />
        </div>
      </fieldset>)}
      <Button
        type="button"
        variant="secondary"
        onPress={() => onChange({ ...value, restrictions: [...value.restrictions, { id: crypto.randomUUID(), type: 'purchase-value', minimum: '', maximum: '' }] })}
      >Adicionar restrição +</Button>
    </section>
    <ConfirmationModal
      action="delete"
      itemName={`condição ${deleteIndex + 1}`}
      isOpen={conditionToDelete !== null}
      onOpenChange={open => {
        if (!open) setConditionToDelete(null)
      }}
      onConfirm={() => {
        if (conditionToDelete) deleteCondition(conditionToDelete)
      }}
    />
  </section>
}
