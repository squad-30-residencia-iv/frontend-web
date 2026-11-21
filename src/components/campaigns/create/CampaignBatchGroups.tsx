import { X } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import { mockCampaignCustomerGroups, selectBatchGroups, type CampaignBatch, type CampaignCustomerGroup } from '../../../data/campaignBatch'
import './CampaignBatchGroups.css'

interface CampaignBatchGroupsProps {
  value: CampaignBatch | null
  onChange: (batch: CampaignBatch | null) => void
  groups?: readonly CampaignCustomerGroup[]
  error?: string
}

export function CampaignBatchGroups({ value, onChange, groups = mockCampaignCustomerGroups, error }: CampaignBatchGroupsProps) {
  const selectedIds = value?.groups.map(group => group.id) ?? []
  return <section className="campaign-batch-groups" aria-label="Destinatários do lote">
    <Select
      selectionMode="multiple"
      label="Grupos de clientes"
      name="customerBase"
      options={groups.map(group => ({ value: group.id, label: group.name + ' (' + group.customerIds.length + ' clientes)' }))}
      value={selectedIds}
      placeholder="Selecione um ou mais grupos"
      onChange={ids => onChange(selectBatchGroups(ids.map(String), groups))}
      isRequired
      validationBehavior="aria"
      errorMessage={error}
    />
    {value && <>
      <ul className="campaign-batch-selected" aria-label="Grupos selecionados">
        {value.groups.map(group => <li key={group.id}>
          <span><strong>{group.name}</strong><span>{group.customerIds.length} clientes</span></span>
          <Button type="button" variant="ghost" isIconOnly aria-label={'Remover ' + group.name} startIcon={X}
            onPress={() => onChange(selectBatchGroups(selectedIds.filter(id => id !== group.id), groups))} />
        </li>)}
      </ul>
      <p className="campaign-batch-count" role="status">{value.groups.length} {value.groups.length === 1 ? 'grupo selecionado' : 'grupos selecionados'} · {value.customerCount} clientes únicos</p>
      <Button type="button" variant="secondary" onPress={() => onChange(null)}>Limpar grupos</Button>
    </>}
    {!groups.length && <p role="status">Nenhum grupo disponível.</p>}
  </section>
}
