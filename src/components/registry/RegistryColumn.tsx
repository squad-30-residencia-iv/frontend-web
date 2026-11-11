import { useId } from 'react'
import { ChevronRight, Pencil, Plus, Power, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Loading } from '../ui/Loading'
import type { RegistryEntity, RegistryRow } from '../../types/registry'
import { countSummary, newLabel, registryCopy, statusLabel } from './registryCopy'
import type { RegistryListState } from './useRegistryList'
import './RegistryColumn.css'

export interface RegistryColumnActions {
  onCreate: () => void
  onEdit: (row: RegistryRow) => void
  onDeactivate: (row: RegistryRow) => void
  onReactivate: (row: RegistryRow) => void
}

interface RegistryColumnProps extends RegistryColumnActions {
  entity: RegistryEntity
  list: RegistryListState
  /** Pai escolhido, ex.: "Rede: Rede Sul". */
  subtitle?: string
  /** Texto enquanto o pai não foi escolhido. */
  idle?: { title: string; description: string }
  /** Com esta função, o nome vira botão que abre os filhos. */
  onSelect?: (row: RegistryRow) => void
  selectedId?: string | null
  /** Motivo para não criar (pai inativo). */
  createBlockedReason?: string
  /** Linha com reativação em andamento. */
  pendingRowId?: string | null
}

export function RegistryColumn({
  entity,
  list,
  subtitle,
  idle,
  onSelect,
  selectedId,
  createBlockedReason,
  pendingRowId,
  onCreate,
  onEdit,
  onDeactivate,
  onReactivate,
}: RegistryColumnProps) {
  const titleId = useId()
  const noteId = useId()
  const { noun, plural } = registryCopy[entity]
  const pluralNoun = plural.toLowerCase()
  const activeCount = list.rows.filter(row => row.isActive).length
  const inactiveCount = list.rows.length - activeCount

  function renderBody() {
    if (list.phase === 'idle') {
      return <EmptyState icon={ChevronRight} title={idle?.title ?? 'Escolha um item'} description={idle?.description} />
    }
    if (list.phase === 'loading') {
      return <Loading message={`Carregando ${pluralNoun}…`} />
    }
    if (list.phase === 'error') {
      return <EmptyState
        title={`Não foi possível carregar ${registryCopy[entity].feminine ? 'as' : 'os'} ${pluralNoun}`}
        description={list.errorMessage || 'Verifique sua conexão e tente novamente.'}
        action={<Button variant="secondary" onPress={list.retry}>Tentar novamente</Button>}
      />
    }
    if (list.rows.length === 0) {
      return <EmptyState
        title={`${registryCopy[entity].feminine ? 'Nenhuma' : 'Nenhum'} ${noun} ${registryCopy[entity].feminine ? 'cadastrada' : 'cadastrado'}`}
        description={createBlockedReason ? undefined : `Use "${newLabel(entity)}" para começar.`}
      />
    }

    return <ul className="registry-list" aria-labelledby={titleId}>
      {list.rows.map(row => {
        const isSelected = selectedId === row.id
        const status = statusLabel(entity, row.isActive)
        return <li
          key={row.id}
          className={[
            'registry-row',
            isSelected ? 'registry-row-selected' : '',
            row.isActive ? '' : 'registry-row-inactive',
          ].filter(Boolean).join(' ')}
        >
          <div className="registry-row-main">
            {onSelect
              ? <button
                  type="button"
                  className="registry-row-select"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(row)}
                >
                  <span className="registry-row-name">{row.name}</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              : <span className="registry-row-name">{row.name}</span>}
            {row.detail && <span className="registry-row-detail">{row.detail}</span>}
          </div>
          <span className={`registry-status registry-status-${row.isActive ? 'active' : 'inactive'}`}>
            {status}
          </span>
          <div className="registry-row-actions">
            <Button
              size="sm"
              variant="ghost"
              startIcon={Pencil}
              aria-label={`Editar ${noun} ${row.name}`}
              onPress={() => onEdit(row)}
            >Editar</Button>
            {row.isActive
              ? <Button
                  size="sm"
                  variant="ghost"
                  className="registry-deactivate"
                  startIcon={Power}
                  aria-label={`Inativar ${noun} ${row.name}`}
                  onPress={() => onDeactivate(row)}
                >Inativar</Button>
              : <Button
                  size="sm"
                  variant="ghost"
                  startIcon={RotateCcw}
                  aria-label={`Reativar ${noun} ${row.name}`}
                  isPending={pendingRowId === row.id}
                  isDisabled={pendingRowId === row.id}
                  onPress={() => onReactivate(row)}
                >Reativar</Button>}
          </div>
        </li>
      })}
    </ul>
  }

  return <section
    className="registry-column"
    aria-labelledby={titleId}
    aria-busy={list.phase === 'loading' || list.isRefreshing}
  >
    <header className="registry-column-header">
      <div className="registry-column-heading">
        <h2 id={titleId}>{plural}</h2>
        {subtitle && <p className="registry-column-subtitle">{subtitle}</p>}
        {list.phase === 'ready' && list.rows.length > 0 && <p className="registry-column-count">
          {countSummary(entity, activeCount, inactiveCount)}
        </p>}
      </div>
      {list.phase !== 'idle' && <Button
        size="sm"
        className="registry-create"
        startIcon={Plus}
        isDisabled={Boolean(createBlockedReason)}
        aria-describedby={createBlockedReason ? noteId : undefined}
        onPress={onCreate}
      >{newLabel(entity)}</Button>}
    </header>
    {list.phase !== 'idle' && createBlockedReason && <p id={noteId} className="registry-column-note">{createBlockedReason}</p>}
    {renderBody()}
  </section>
}
