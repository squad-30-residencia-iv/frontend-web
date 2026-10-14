import { Plus, X } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import type { CampaignDraft } from '../../../types/campaign'
import { categoryOptions, productOptions, customerBases, getBatchTotal, parseDiscount, type CampaignBenefitsErrors } from '../../../data/campaignBenefits'
import './CampaignBenefitsForm.css'

type Benefits = CampaignDraft['benefits']
interface CampaignBenefitsFormProps {
  value: Benefits
  errors: CampaignBenefitsErrors
  onChange: (value: Benefits) => void
  onAddBenefit: () => void
}
const integerInputProps = { min: 1, step: 1 }
const formatNumber = new Intl.NumberFormat('pt-BR')
const formatMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function CampaignBenefitsForm({ value, errors, onChange, onAddBenefit }: CampaignBenefitsFormProps) {
  function update<Key extends keyof Benefits>(key: Key, fieldValue: Benefits[Key]) { onChange({ ...value, [key]: fieldValue }) }
  const specific = value.application === 'specific'
  const batch = value.generationMode === 'batch'
  return <section className="create-campaign-information campaign-benefits" aria-labelledby="campaign-benefits-title">
    <h2 id="campaign-benefits-title" tabIndex={-1}>Alvos e benefícios</h2>
    <fieldset className="campaign-benefits-choice">
      <legend>Tipo de benefício</legend>
      <p>Use dois cards selecionáveis:</p>
      <label><input type="radio" name="discountType" value="percentage" checked={value.discountType === 'percentage'} onChange={() => update('discountType', 'percentage')} />Desconto percentual (%)</label>
      <label><input type="radio" name="discountType" value="fixed" checked={value.discountType === 'fixed'} onChange={() => update('discountType', 'fixed')} />Desconto com valor fixo (R$)</label>
    </fieldset>
    <div className="campaign-benefits-panel campaign-benefits-discount">
      <Input label="Valor do desconto (%)" name="percentage" value={value.percentage} onChange={next => update('percentage', next)} isRequired={value.discountType === 'percentage'} validationBehavior="aria" errorMessage={errors.percentage} inputProps={{ inputMode: 'decimal' }} />
      <span className="campaign-benefits-or">OU</span>
      <Input label="Valor do desconto (R$)" name="fixedAmount" value={value.fixedAmount} onChange={next => update('fixedAmount', next)} isRequired={value.discountType === 'fixed'} validationBehavior="aria" errorMessage={errors.fixedAmount} inputProps={{ inputMode: 'decimal' }} />
      <Button type="button" variant="secondary" endIcon={Plus} onPress={onAddBenefit}>Adicionar</Button>
    </div>
    {value.addedBenefits.length > 0 && <ul className="campaign-benefits-added" aria-label="Benefícios adicionados">{value.addedBenefits.map((benefit, index) => <li key={`${index}-${benefit.type}-${benefit.value}`}>
      <span>{benefit.type === 'percentage' ? `${formatNumber.format(parseDiscount(benefit.value))}%` : formatMoney.format(parseDiscount(benefit.value))}</span>
      <Button type="button" variant="ghost" isIconOnly aria-label={`Remover benefício ${index + 1}`} startIcon={X} onPress={() => update('addedBenefits', value.addedBenefits.filter((_, itemIndex) => itemIndex !== index))} />
    </li>)}</ul>}
    {errors.addedBenefits && <p className="campaign-benefits-error" role="alert">{errors.addedBenefits}</p>}

    <h3>Aplicação do benefício</h3>
    <fieldset className="campaign-benefits-choice">
      <legend>O desconto será aplicado em:</legend>
      <label><input type="radio" name="application" value="total" checked={!specific} onChange={() => update('application', 'total')} />Valor total da compra</label>
      <label><input type="radio" name="application" value="specific" checked={specific} onChange={() => update('application', 'specific')} />Produtos ou categorias específicas</label>
    </fieldset>
    <div className="campaign-benefits-targets">
      <Select label="Tipo" name="targetType" options={[{ value: 'category', label: 'Categoria' }, { value: 'product', label: 'Produto' }]} value={value.targetType} onChange={next => onChange({ ...value, targetType: next === 'product' ? 'product' : 'category', targetIds: [] })} />
      <Select selectionMode="multiple" label="Produtos ou categoria" name="targetIds" options={value.targetType === 'category' ? categoryOptions : productOptions} value={value.targetIds} onChange={next => update('targetIds', next.map(String))} placeholder="Selecione uma ou mais opções" isRequired={specific} validationBehavior="aria" errorMessage={errors.targetIds} />
    </div>
    <Input className="campaign-benefits-maximum" label="Quantidade máxima da campanha / Quantidade por cliente:" name="maxVouchers" value={value.maxVouchers} onChange={next => update('maxVouchers', next)} type="number" inputProps={integerInputProps} isRequired validationBehavior="aria" errorMessage={errors.maxVouchers} description={`vouchers / ${batch ? value.quantityPerCustomer : value.limitPerCustomer}`} />

    <h3>Forma de geração</h3>
    <fieldset className="campaign-benefits-choice">
      <legend className="create-campaign-sr-only">Forma de geração dos vouchers</legend>
      <label><input type="radio" name="generationMode" value="automatic" checked={!batch} onChange={() => update('generationMode', 'automatic')} />Automática</label>
      <label><input type="radio" name="generationMode" value="batch" checked={batch} onChange={() => update('generationMode', 'batch')} />Em lote</label>
    </fieldset>
    <section aria-labelledby="campaign-automatic-title">
      <h4 id="campaign-automatic-title">Automática:</h4>
      <p>O voucher será gerado automaticamente quando o cliente atender às condições definidas na campanha.</p>
      <div className="campaign-benefits-panel campaign-benefits-automatic">
        <Input label="Quantidade por concessão" name="quantityPerGrant" type="number" inputProps={integerInputProps} value={value.quantityPerGrant} onChange={next => update('quantityPerGrant', next)} isRequired={!batch} validationBehavior="aria" errorMessage={errors.quantityPerGrant} />
        <Input label="Limite por cliente" name="limitPerCustomer" type="number" inputProps={integerInputProps} value={value.limitPerCustomer} onChange={next => update('limitPerCustomer', next)} isRequired={!batch} validationBehavior="aria" errorMessage={errors.limitPerCustomer} />
      </div>
    </section>
    <section aria-labelledby="campaign-batch-title">
      <h4 id="campaign-batch-title">Em lote:</h4>
      <p>Os vouchers serão gerados de uma única vez para uma base de clientes.</p>
      <div className="campaign-benefits-panel campaign-benefits-batch">
        <Select label="Base de clientes" name="customerBase" options={customerBases} value={value.customerBase || null} onChange={next => update('customerBase', String(next ?? ''))} isRequired={batch} validationBehavior="aria" errorMessage={errors.customerBase} />
        <Input label="Quantidade por cliente" name="quantityPerCustomer" type="number" inputProps={integerInputProps} value={value.quantityPerCustomer} onChange={next => update('quantityPerCustomer', next)} isRequired={batch} validationBehavior="aria" errorMessage={errors.quantityPerCustomer} />
        <div className="campaign-benefits-total"><span id="campaign-total-label">Total previsto</span><output aria-labelledby="campaign-total-label" aria-live="polite">{formatNumber.format(getBatchTotal(value))} vouchers</output></div>
      </div>
    </section>
  </section>
}
