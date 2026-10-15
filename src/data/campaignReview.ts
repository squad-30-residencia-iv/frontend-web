import type { CampaignChannel, CampaignDraft } from '../types/campaign'
import { categoryOptions, productOptions, customerBases, getBatchTotal, parseDiscount } from './campaignBenefits'
import { campaignStores } from './campaignScope'

export interface CampaignReviewField {
  label: string
  value: string
}

export interface CampaignReviewSection {
  title: string
  fields: CampaignReviewField[]
}

const numberFormat = new Intl.NumberFormat('pt-BR')
const moneyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const channelLabels: Record<CampaignChannel, string> = { physical: 'Físico', virtual: 'Virtual' }

function formatDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}` : 'Não informado'
}

function formatMoney(value: string) {
  const amount = parseDiscount(value)
  return Number.isFinite(amount) ? moneyFormat.format(amount) : 'Não informado'
}

function formatQuantity(value: string) {
  return value.trim() && Number.isFinite(Number(value)) ? numberFormat.format(Number(value)) : 'Não informado'
}

function formatDiscount(type: 'percentage' | 'fixed', value: string) {
  if (type === 'fixed') return formatMoney(value)
  const amount = parseDiscount(value)
  return Number.isFinite(amount) ? `${numberFormat.format(amount)}%` : 'Não informado'
}

export function getCampaignReviewSections(draft: CampaignDraft): CampaignReviewSection[] {
  const { information, benefits, rules, scope } = draft
  const isNetwork = scope.mode === 'network'
  const channels = isNetwork ? scope.networkChannels : scope.storeChannels
  const storeNames = scope.storeIds.map(id => {
    const store = campaignStores.find(item => item.id === id)
    return store ? `${store.code} — ${store.name}` : 'Loja indisponível'
  })
  const targetOptions = benefits.targetType === 'category' ? categoryOptions : productOptions
  const targetNames = benefits.targetIds.map(id => targetOptions.find(option => option.value === id)?.label ?? 'Item indisponível')
  const isSpecific = benefits.application === 'specific'
  const isAutomatic = benefits.generationMode === 'automatic'
  const discountValue = benefits.discountType === 'percentage' ? benefits.percentage : benefits.fixedAmount
  const conditionSeparator = rules.conditionMatch === 'all' ? ' E ' : ' OU '
  const restrictionSeparator = rules.restrictionMatch === 'all' ? ' E ' : ' OU '

  const benefitFields: CampaignReviewField[] = [
    { label: 'Desconto', value: benefits.discountType === 'percentage' ? 'Percentual' : 'Valor fixo' },
    { label: 'Valor', value: formatDiscount(benefits.discountType, discountValue) },
    { label: 'Aplicação', value: isSpecific ? 'Produtos ou categorias específicas' : 'Valor total da compra' },
    { label: 'Tipo', value: isSpecific ? (benefits.targetType === 'category' ? 'Categoria' : 'Produto') : 'Não se aplica' },
    { label: 'Produto ou categoria', value: isSpecific ? (targetNames.join(', ') || 'Não informado') : 'Toda a compra' },
    { label: 'Quantidade máxima da campanha', value: `${formatQuantity(benefits.maxVouchers)} vouchers` },
    { label: 'Quantidade por cliente', value: formatQuantity(isAutomatic ? benefits.limitPerCustomer : benefits.quantityPerCustomer) },
    { label: 'Forma de geração', value: isAutomatic ? 'Automática' : 'Em lote' },
  ]

  if (benefits.addedBenefits.length) {
    benefitFields.push({ label: 'Benefícios adicionados', value: benefits.addedBenefits.map(item => formatDiscount(item.type, item.value)).join('; ') })
  }
  if (isAutomatic) {
    benefitFields.push({ label: 'Quantidade por concessão', value: formatQuantity(benefits.quantityPerGrant) })
  } else {
    const base = customerBases.find(item => item.value === benefits.customerBase)
    benefitFields.push(
      { label: 'Base de clientes', value: base ? `Base ${base.label} (${numberFormat.format(base.customers)} clientes)` : 'Não informado' },
      { label: 'Total previsto', value: `${numberFormat.format(getBatchTotal(benefits))} vouchers` },
    )
  }

  return [
    {
      title: 'Informações',
      fields: [
        { label: 'Nome', value: information.name.trim() || 'Não informado' },
        { label: 'Vigência', value: `${formatDateTime(information.start)} a ${formatDateTime(information.end)}` },
        { label: 'Modelo', value: information.voucherModel === 'relative' ? 'Prazo relativo' : 'Não informado' },
        { label: 'Validade', value: `${formatQuantity(information.voucherDurationDays)} dias após a emissão` },
        { label: 'Teto máximo', value: information.voucherCap === 'unlimited' ? 'Sem teto' : 'Não informado' },
        { label: 'Rede', value: isNetwork ? 'Toda a rede' : (storeNames.join(', ') || 'Não informado') },
        { label: 'Canais', value: channels.map(channel => channelLabels[channel]).join(', ') || 'Não informado' },
      ],
    },
    { title: 'Alvo e benefícios', fields: benefitFields },
    {
      title: 'Regras e público',
      fields: [
        { label: 'Público', value: rules.audience === 'all' ? 'Todos os clientes' : 'Não informado' },
        { label: 'Condições', value: rules.conditionMatch === 'all' ? 'Todas as condições — E' : 'Pelo menos uma condição — OU' },
        {
          label: 'Condição',
          value: rules.conditions.map(item => {
            const type = item.type === 'purchase-total' ? 'Valor total da compra' : 'Tipo não informado'
            const operator = item.operator === 'gte' ? 'maior ou igual a' : 'operador não informado'
            return `${type} ${operator} ${formatMoney(item.value)}`
          }).join(conditionSeparator) || 'Nenhuma condição adicionada',
        },
        { label: 'Restrições', value: rules.restrictionMatch === 'all' ? 'Todas as restrições — E' : 'Pelo menos uma restrição — OU' },
        {
          label: 'Restrição',
          value: rules.restrictions.map(item => {
            const type = item.type === 'purchase-value' ? 'Valor da compra' : 'Tipo não informado'
            const maximum = item.maximum.trim() ? formatMoney(item.maximum) : 'Sem limite'
            return `${type}: mínimo ${formatMoney(item.minimum)}; máximo ${maximum}`
          }).join(restrictionSeparator) || 'Nenhuma restrição adicionada',
        },
      ],
    },
  ]
}
