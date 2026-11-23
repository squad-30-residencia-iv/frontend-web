import { CampaignBatchGroups } from './CampaignBatchGroups'
import type { CampaignBatch } from '../../../data/campaignBatch'
import { X } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import type { CampaignDraft } from '../../../types/campaign'
import {
  applyProductCodeBatch,
  categoryOptions,
  productOptions,
  getBatchTotal,
  parseDiscount,
  parseProductCodes,
  targetOptionLabel,
  type CampaignBenefitsErrors,
} from '../../../data/campaignBenefits'
import './CampaignBenefitsForm.css'

type Benefits = CampaignDraft['benefits']
interface CampaignBenefitsFormProps {
  value: Benefits
  errors: CampaignBenefitsErrors
  categories?: readonly { value: string; label: string }[]
  products?: readonly { value: string; label: string; code?: string }[]
  batchSelection: CampaignBatch | null
  onBatchChange: (batch: CampaignBatch | null) => void
  onChange: (value: Benefits) => void
}
const integerInputProps = { min: 1, step: 1 }
const formatNumber = new Intl.NumberFormat('pt-BR')
const formatMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function CampaignBenefitsForm({
  value,
  errors,
  categories = categoryOptions,
  products = productOptions,
  batchSelection,
  onBatchChange,
  onChange,
}: CampaignBenefitsFormProps) {

  function update<Key extends keyof Benefits>(key: Key, fieldValue: Benefits[Key]) {
    onChange({ ...value, [key]: fieldValue })
  }
  const specific = value.application === 'specific'
  const batch = value.generationMode === 'batch'
  const productTargets = products.map(option => ({ value: option.value, label: targetOptionLabel(option) }))

  function commitSelectorCodes(text: string) {
    const next = applyProductCodeBatch(value.targetIds, value.productCodes, text, products)
    onChange({ ...value, targetIds: next.targetIds, productCodes: next.productCodes })
  }
  return <section className="create-campaign-information campaign-benefits" aria-labelledby="campaign-benefits-title">
    <h2 id="campaign-benefits-title" tabIndex={-1}>Alvos e benefícios</h2>
    <Select
      className="campaign-benefits-type"
      label="Tipo de benefício"
      name="discountType"
      options={[{ value: 'percentage', label: 'Desconto percentual (%)' }, { value: 'fixed', label: 'Desconto com valor fixo (R$)' }]}
      value={value.discountType}
      onChange={next => update('discountType', next === 'fixed' ? 'fixed' : 'percentage')}
    />
    <div className="campaign-benefits-panel campaign-benefits-discount">
      {value.discountType === 'percentage' ? <>
        <Input
          label="Valor do desconto (%)"
          name="percentage"
          value={value.percentage}
          onChange={next => update('percentage', next)}
          isRequired={value.discountType === 'percentage'}
          validationBehavior="aria"
          errorMessage={errors.percentage}
          inputProps={{ inputMode: 'decimal' }}
        />
        <Input
          label="Valor máximo de desconto (R$)"
          name="maximumDiscount"
          value={value.maximumDiscount ?? ''}
          onChange={next => update('maximumDiscount', next)}
          placeholder="Sem limite"
          errorMessage={errors.maximumDiscount}
          inputProps={{ inputMode: 'decimal' }}
        />
      </> :
        <Input
          label="Valor do desconto (R$)"
          name="fixedAmount"
          value={value.fixedAmount}
          onChange={next => update('fixedAmount', next)}
          isRequired={value.discountType === 'fixed'}
          validationBehavior="aria"
          errorMessage={errors.fixedAmount}
          inputProps={{ inputMode: 'decimal' }}
        />
      }
    </div>
    {value.addedBenefits.length > 0 && <ul className="campaign-benefits-added" aria-label="Benefícios adicionados">
      {value.addedBenefits.map((benefit, index) => <li key={`${index}-${benefit.type}-${benefit.value}`}>
        <span>
          {benefit.type === 'percentage' ? `${formatNumber.format(parseDiscount(benefit.value))}%` : formatMoney.format(parseDiscount(benefit.value))}
          {benefit.type === 'percentage' && benefit.maximumDiscount && ` (máximo ${formatMoney.format(parseDiscount(benefit.maximumDiscount))})`}
        </span>
        <Button
          type="button"
          variant="ghost"
          isIconOnly
          aria-label={`Remover benefício ${index + 1}`}
          startIcon={X}
          onPress={() => update('addedBenefits', value.addedBenefits.filter((_, itemIndex) => itemIndex !== index))}
        />
      </li>)}
    </ul>}
    {errors.addedBenefits && <p className="campaign-benefits-error" role="alert">
      {errors.addedBenefits}
    </p>}
    <h3>Aplicação do benefício</h3>
    <fieldset className="campaign-benefits-choice">
      <legend>O desconto será aplicado em:</legend>
      <label>
        <input
          type="radio"
          name="application"
          value="total"
          checked={!specific}
          onChange={() => update('application', 'total')}
        />Valor total da compra
      </label>
      <label>
        <input
          type="radio"
          name="application"
          value="specific"
          checked={specific}
          onChange={() => update('application', 'specific')}
        />Produtos ou categorias específicas
      </label>
    </fieldset>
    <div className="campaign-benefits-targets">
      <Select
        label="Tipo"
        name="targetType"
        options={[{ value: 'category', label: 'Categoria' }, { value: 'product', label: 'Produto' }]}
        value={value.targetType}
        onChange={next => onChange({
          ...value,
          targetType: next === 'product' ? 'product' : 'category',
          targetIds: [],
          productCodes: next === 'product' ? value.productCodes : '',
        })}
      />
      <Select
        selectionMode="multiple"
        label="Produtos ou categoria"
        name="targetIds"
        options={value.targetType === 'category' ? categories : productTargets}
        value={value.targetIds}
        onChange={next => update('targetIds', next.map(String))}
        placeholder="Selecione uma ou mais opções"
        isRequired={specific && (value.targetType === 'category' || parseProductCodes(value.productCodes).length === 0)}
        validationBehavior="aria"
        errorMessage={errors.targetIds}
      />
      {value.targetType === 'product' && <>
        <div className="campaign-benefits-codes">
          <label htmlFor="campaign-product-selector-codes">Adicionar ao seletor por código</label>
          <input
            id="campaign-product-selector-codes"
            name="selectorProductCodes"
            placeholder="MOD-001 — Camiseta, CAL-001"
            onKeyDown={event => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              commitSelectorCodes(event.currentTarget.value)
              event.currentTarget.value = ''
            }}
            onPaste={event => {
              const text = event.clipboardData.getData('text')
              if (!/[\n,;]/.test(text)) return
              event.preventDefault()
              commitSelectorCodes(text)
              event.currentTarget.value = ''
            }}
          />
          <p className="campaign-benefits-codes-hint">Digite ou cole vários códigos (com ou sem o nome) e pressione Enter. O produto do catálogo entra no seletor.</p>
        </div>
      <div className="campaign-benefits-codes">
        <label htmlFor="campaign-product-codes">Códigos de produto</label>
        <textarea
          id="campaign-product-codes"
          name="productCodes"
          value={value.productCodes}
          onChange={event => update('productCodes', event.target.value)}
          rows={8}
          placeholder={'MOD-001 — Camiseta básica\nCAL-001 — Tênis casual'}
          aria-invalid={Boolean(errors.productCodes) || undefined}
          aria-describedby={errors.productCodes ? 'campaign-product-codes-error' : 'campaign-product-codes-hint'}
        />
        <p id="campaign-product-codes-hint" className="campaign-benefits-codes-hint">
          Lote: um código por linha, com ou sem o nome (CODIGO — produto). Também aceita vírgula ou ponto e vírgula.
        </p>
        {errors.productCodes && <p id="campaign-product-codes-error" className="campaign-benefits-error" role="alert">
          {errors.productCodes}
        </p>}
      </div>
      </>}
    </div>
    <Input
      className="campaign-benefits-maximum"
      label="Quantidade máxima da campanha / Quantidade por cliente:"
      name="maxVouchers"
      value={value.maxVouchers}
      onChange={next => update('maxVouchers', next)}
      type="number"
      inputProps={integerInputProps}
      isRequired
      validationBehavior="aria"
      errorMessage={errors.maxVouchers}
      description={`vouchers / ${batch ? value.quantityPerCustomer : value.limitPerCustomer}`}
    />
    <h3>Forma de geração</h3>
    <fieldset className="campaign-benefits-choice">
      <legend className="create-campaign-sr-only">Forma de geração dos vouchers</legend>
      <label>
        <input
          type="radio"
          name="generationMode"
          value="automatic"
          checked={!batch}
          onChange={() => update('generationMode', 'automatic')}
        />Automática
      </label>
      <label>
        <input
          type="radio"
          name="generationMode"
          value="batch"
          checked={batch}
          onChange={() => update('generationMode', 'batch')}
        />Em lote
      </label>
    </fieldset>
    {!batch && <section aria-labelledby="campaign-automatic-title">
      <h4 id="campaign-automatic-title">Automática:</h4>
      <p>O voucher será gerado automaticamente quando o cliente atender às condições definidas na campanha.</p>
      <div className="campaign-benefits-panel campaign-benefits-automatic">
        <Input
          label="Quantidade por concessão"
          name="quantityPerGrant"
          type="number"
          inputProps={integerInputProps}
          value={value.quantityPerGrant}
          onChange={next => update('quantityPerGrant', next)}
          isRequired={!batch}
          validationBehavior="aria"
          errorMessage={errors.quantityPerGrant}
        />
        <Input
          label="Limite por cliente"
          name="limitPerCustomer"
          type="number"
          inputProps={integerInputProps}
          value={value.limitPerCustomer}
          onChange={next => update('limitPerCustomer', next)}
          isRequired={!batch}
          validationBehavior="aria"
          errorMessage={errors.limitPerCustomer}
        />
      </div>
    </section>}
    {batch && <section aria-labelledby="campaign-batch-title">
      <h4 id="campaign-batch-title">Em lote:</h4>
      <CampaignBatchGroups value={batchSelection} onChange={onBatchChange} error={errors.customerBase} />
      <div className="campaign-benefits-panel campaign-benefits-batch">
        <Input
          label="Quantidade por cliente"
          name="quantityPerCustomer"
          type="number"
          inputProps={integerInputProps}
          value={value.quantityPerCustomer}
          onChange={next => update('quantityPerCustomer', next)}
          isRequired={batch}
          validationBehavior="aria"
          errorMessage={errors.quantityPerCustomer}
        />
        <div className="campaign-benefits-total">
          <span id="campaign-total-label">Total previsto</span>
          <output aria-labelledby="campaign-total-label" aria-live="polite">
            {formatNumber.format(getBatchTotal(value, batchSelection?.customerCount ?? 0))} vouchers
          </output>
        </div>
      </div>
    </section>}
  </section>
}
