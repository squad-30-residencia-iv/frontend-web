import { fetchNetworks, fetchRegions, fetchStores } from '../../services/registry'
import type { RegistryRow } from '../../types/registry'
import { RegistryColumn } from './RegistryColumn'
import { defaultTimeZone } from './registryCopy'
import { networkRow, regionRow, storeRow } from './registryRows'
import type { RegistryEditorActions } from './useRegistryEditor'
import { useRegistryList } from './useRegistryList'
import './RegistryPanel.css'

export interface HierarchySelection {
  networkId: string | null
  regionId: string | null
}

interface HierarchyPanelProps {
  selection: HierarchySelection
  onSelectionChange: (selection: HierarchySelection) => void
  refreshKey: number
  editor: RegistryEditorActions
  reactivatingId: string | null
}

/** Rede → regiões da rede → lojas da região. */
export function HierarchyPanel({ selection, onSelectionChange, refreshKey, editor, reactivatingId }: HierarchyPanelProps) {
  const { networkId, regionId } = selection

  const networks = useRegistryList('all', async () => (await fetchNetworks()).map(networkRow), refreshKey)
  const regions = useRegistryList(networkId, async () => networkId ? (await fetchRegions(networkId)).map(regionRow) : [], refreshKey)
  const stores = useRegistryList(regionId, async () => regionId ? (await fetchStores(regionId)).map(storeRow) : [], refreshKey)

  const network = networks.rows.find(row => row.id === networkId) ?? null
  const region = regions.rows.find(row => row.id === regionId) ?? null
  const networkLabel = network ? `Rede: ${network.name}` : undefined
  const regionLabel = region ? `Região: ${region.name}` : undefined

  function selectNetwork(row: RegistryRow) {
    if (row.id !== networkId) onSelectionChange({ networkId: row.id, regionId: null })
  }

  function selectRegion(row: RegistryRow) {
    onSelectionChange({ networkId, regionId: row.id })
  }

  return <div className="registry-columns registry-columns-three">
    <RegistryColumn
      entity="network"
      list={networks}
      selectedId={networkId}
      onSelect={selectNetwork}
      pendingRowId={reactivatingId}
      onCreate={() => editor.openCreate('network', null, { timeZone: defaultTimeZone })}
      onEdit={row => editor.openEdit('network', row)}
      onDeactivate={row => editor.askDeactivate('network', row)}
      onReactivate={row => editor.reactivate('network', row)}
    />
    <RegistryColumn
      entity="region"
      list={regions}
      subtitle={networkLabel}
      idle={{ title: 'Escolha uma rede', description: 'As regiões da rede escolhida aparecem aqui.' }}
      selectedId={regionId}
      onSelect={selectRegion}
      createBlockedReason={network && !network.isActive ? 'Reative a rede para cadastrar regiões.' : undefined}
      pendingRowId={reactivatingId}
      onCreate={() => editor.openCreate('region', networkId, {}, networkLabel)}
      onEdit={row => editor.openEdit('region', row, networkLabel)}
      onDeactivate={row => editor.askDeactivate('region', row)}
      onReactivate={row => editor.reactivate('region', row)}
    />
    <RegistryColumn
      entity="store"
      list={stores}
      subtitle={regionLabel}
      idle={{ title: 'Escolha uma região', description: 'As lojas da região escolhida aparecem aqui.' }}
      createBlockedReason={region && !region.isActive ? 'Reative a região para cadastrar lojas.' : undefined}
      pendingRowId={reactivatingId}
      onCreate={() => editor.openCreate('store', regionId, {}, regionLabel)}
      onEdit={row => editor.openEdit('store', row, regionLabel)}
      onDeactivate={row => editor.askDeactivate('store', row)}
      onReactivate={row => editor.reactivate('store', row)}
    />
  </div>
}
