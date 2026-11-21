export interface CampaignCustomerGroup {
  id: string
  name: string
  customerIds: readonly string[]
}

/** Catálogo demonstrativo até existir consulta de grupos no backend. Sem CPFs. */
export const mockCampaignCustomerGroups: readonly CampaignCustomerGroup[] = [
  { id: 'demo-group-a', name: 'Grupo demonstrativo A', customerIds: ['demo-customer-1', 'demo-customer-2'] },
  { id: 'demo-group-b', name: 'Grupo demonstrativo B', customerIds: ['demo-customer-2', 'demo-customer-3', 'demo-customer-4'] },
  { id: 'demo-group-c', name: 'Grupo demonstrativo C', customerIds: ['demo-customer-5'] },
]

export interface CampaignBatch {
  groups: readonly CampaignCustomerGroup[]
  customerCount: number
}

export function selectBatchGroups(
  ids: readonly string[],
  catalog: readonly CampaignCustomerGroup[] = mockCampaignCustomerGroups,
): CampaignBatch | null {
  const groups = catalog.filter(group => ids.includes(group.id))
  if (!groups.length) return null
  const customerIds = new Set(groups.flatMap(group => group.customerIds))
  return { groups, customerCount: customerIds.size }
}

export function batchIsReady(batch: CampaignBatch | null): batch is CampaignBatch {
  return Boolean(batch?.groups.length && batch.customerCount > 0)
}
