import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import type { CampaignDraft } from '../../../types/campaign'
import type { CampaignInformationErrors } from '../../../data/campaignDraft'

type Information = CampaignDraft['information']
interface CampaignInformationFormProps {
  information: Information
  errors: CampaignInformationErrors
  onChange: <Key extends keyof Information>(key: Key, value: Information[Key]) => void
}
const modelOptions = [{ value: 'relative', label: 'Prazo relativo' }]
const capOptions = [{ value: 'unlimited', label: 'Sem teto' }]

export function CampaignInformationForm({ information, errors, onChange }: CampaignInformationFormProps) {
  return (<section className="create-campaign-information" aria-labelledby="campaign-information-title">
    <h2 id="campaign-information-title" tabIndex={-1}>Informações básicas</h2>
    <p className="create-campaign-description">Identifique a campanha e defina quando ela poderá emitir vouchers.</p>
    <Input
      label="Nome da campanha"
      name="name"
      placeholder="Ex.: Volta às Aulas 2026"
      value={information.name}
      onChange={value => onChange('name', value)}
      isRequired
      validationBehavior="aria"
      errorMessage={errors.name}
    />
    <div className="create-campaign-dates">
      <Input
        label="Início da vigência"
        name="start"
        type="datetime-local"
        value={information.start}
        onChange={value => onChange('start', value)}
        isRequired
        validationBehavior="aria"
        errorMessage={errors.start}
      />
      <Input
        label="Fim da vigência"
        name="end"
        type="datetime-local"
        value={information.end}
        onChange={value => onChange('end', value)}
        isRequired
        validationBehavior="aria"
        errorMessage={errors.end}
      />
    </div>
    <section className="create-campaign-validity" aria-labelledby="voucher-validity-title">
      <h3 id="voucher-validity-title">Validade do voucher</h3>
      <p>Independente da vigência da campanha</p>
      <div className="create-campaign-validity-fields">
        <Select
          label="Modelo"
          name="voucherModel"
          options={modelOptions}
          value={information.voucherModel || null}
          onChange={value => onChange('voucherModel', value === 'relative' ? 'relative' : '')}
          isRequired
          validationBehavior="aria"
          errorMessage={errors.voucherModel}
        />
        <div className="create-campaign-duration">
          <Input
            label="Duração"
            name="voucherDurationDays"
            type="number"
            value={information.voucherDurationDays}
            onChange={value => onChange('voucherDurationDays', value)}
            isRequired
            validationBehavior="aria"
            inputProps={{ min: 1, step: 1, 'aria-describedby': 'voucher-duration-unit' }}
            errorMessage={errors.voucherDurationDays}
          />
          <span id="voucher-duration-unit" className="create-campaign-duration-unit">dias após a emissão</span>
        </div>
        <Select
          label="Teto máximo"
          name="voucherCap"
          options={capOptions}
          value={information.voucherCap || null}
          onChange={value => onChange('voucherCap', value === 'unlimited' ? 'unlimited' : '')}
          isRequired
          validationBehavior="aria"
          errorMessage={errors.voucherCap}
        />
      </div>
    </section>
  </section>)
}
