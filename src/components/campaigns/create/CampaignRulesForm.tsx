import { Fragment, useEffect, useRef, useState } from 'react'
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
interface MatchModeProps {
  kind: 'conditions' | 'restrictions'
  value: 'all' | 'any'
  count: number
  onChange: (value: 'all' | 'any') => void
}

function MatchMode({ kind, value, count, onChange }: MatchModeProps) {
  const conditions = kind === 'conditions'
  const noun = conditions ? 'condições' : 'restrições'
  return <>
    <fieldset className="campaign-rules-choice">
      <legend>Como combinar as {noun}?</legend>
      <label>
        <input type="radio" name={conditions ? 'conditionMatch' : 'restrictionMatch'} value="all"
          checked={value === 'all'} onChange={() => onChange('all')} />
        <span><strong>Exigir todas</strong><small>Todas as {noun} precisam ser atendidas (E).</small></span>
      </label>
      <label>
        <input type="radio" name={conditions ? 'conditionMatch' : 'restrictionMatch'} value="any"
          checked={value === 'any'} onChange={() => onChange('any')} />
        <span><strong>Basta uma</strong><small>Atender pelo menos uma das {noun} é suficiente (OU).</small></span>
      </label>
    </fieldset>
    <p className="campaign-rules-match-help" role="status">
      {count === 0 ? `Nenhuma ${conditions ? 'condição' : 'restrição'} cadastrada neste grupo.`
        : count === 1 ? 'Com apenas uma regra, as duas opções têm o mesmo resultado. A combinação será usada ao adicionar outras.'
          : value === 'all' ? `Todas as ${count} ${noun} deste grupo devem ser atendidas.`
            : `Basta atender uma das ${count} ${noun} deste grupo.`}
    </p>
  </>
}
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
  const [deleteAllRestrictionsOpen, setDeleteAllRestrictionsOpen] = useState(false)
  const addRestrictionRef = useRef<HTMLButtonElement>(null)
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
    <section className="campaign-rules-panel" aria-labelledby="campaign-conditions-title">
      <h3 id="campaign-conditions-title">Condições</h3>
      <p>Defina o que o cliente precisa atender para gerar o voucher.</p>
      <MatchMode kind="conditions" value={value.conditionMatch} count={value.conditions.length}
        onChange={conditionMatch => onChange({ ...value, conditionMatch })} />
      {value.conditions.map((condition, index) => <Fragment key={condition.id}>
        {index > 0 && <div className="campaign-rules-connector" aria-label="Combinação entre condições">{value.conditionMatch === 'all' ? 'E' : 'OU'}</div>}
        <fieldset className="campaign-rules-item">
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
      </fieldset></Fragment>)}
      <Button
        ref={addConditionRef}
        type="button"
        variant="secondary"
        onPress={() => onChange({ ...value, conditions: [...value.conditions, { id: crypto.randomUUID(), type: 'purchase-total', operator: 'gte', value: '' }] })}
      >Adicionar condição +</Button>
    </section>
    <section className="campaign-rules-panel" aria-labelledby="campaign-restrictions-title">
      <h3 id="campaign-restrictions-title">Restrições</h3>
      <p>Defina os limites da compra e como eles devem ser combinados.</p>
      <MatchMode kind="restrictions" value={value.restrictionMatch} count={value.restrictions.length}
        onChange={restrictionMatch => onChange({ ...value, restrictionMatch })} />
      {value.restrictions.map((restriction, index) => <Fragment key={restriction.id}>
        {index > 0 && <div className="campaign-rules-connector" aria-label="Combinação entre restrições">{value.restrictionMatch === 'all' ? 'E' : 'OU'}</div>}
        <fieldset className="campaign-rules-item">
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
      </fieldset></Fragment>)}
      <Button
        ref={addRestrictionRef}
        type="button"
        variant="secondary"
        onPress={() => onChange({ ...value, restrictions: [...value.restrictions, { id: crypto.randomUUID(), type: 'purchase-value', minimum: '', maximum: '' }] })}
      >Adicionar restrição +</Button>
      {value.restrictions.length > 0 && <Button
        className="campaign-rules-delete-all"
        type="button"
        variant="ghost"
        startIcon={Trash2}
        onPress={() => setDeleteAllRestrictionsOpen(true)}
      >Excluir todas as restrições</Button>}
    </section>
    <ConfirmationModal
      action="delete"
      itemName="todas as restrições"
      isOpen={deleteAllRestrictionsOpen}
      onOpenChange={setDeleteAllRestrictionsOpen}
      onConfirm={() => {
        onChange({ ...value, restrictions: [] })
        setDeleteAllRestrictionsOpen(false)
        addRestrictionRef.current?.focus()
        feedback.success({ title: 'Todas as restrições foram excluídas do rascunho.' })
      }}
    />
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
