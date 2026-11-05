import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import {
  allValue, defaultReportFilters, establishmentOptions, normalizeReportFilters, regionOptions,
} from '../../data/reportFilters'
import type { ReportCatalog, ReportFilters, ReportOption } from '../../types/report'
import './ReportFiltersForm.css'

export interface ReportFiltersFormProps {
  catalog: ReportCatalog
  /** Filtros em edição (campos). */
  draft: ReportFilters
  /** Filtros já aplicados (chips). */
  applied: ReportFilters
  isBusy?: boolean
  onDraftChange: (filters: ReportFilters) => void
  onApply: () => void
  onClear: () => void
  onRemoveFilter: (field: keyof ReportFilters) => void
}

interface FilterField {
  field: keyof ReportFilters
  label: string
  allLabel?: string
  options: readonly ReportOption[]
}

export function ReportFiltersForm({ catalog, draft, applied, isBusy, onDraftChange, onApply, onClear, onRemoveFilter }: ReportFiltersFormProps) {
  const fields: FilterField[] = [
    { field: 'period', label: 'Período', options: catalog.periods },
    { field: 'campaign', label: 'Campanha', allLabel: 'Todas', options: catalog.campaigns },
    { field: 'category', label: 'Categoria', allLabel: 'Todas', options: catalog.categories },
    { field: 'network', label: 'Rede', allLabel: 'Todas', options: catalog.networks },
    { field: 'region', label: 'Região', allLabel: 'Todas', options: regionOptions(catalog, draft.network) },
    { field: 'establishment', label: 'Estabelecimento', allLabel: 'Todos', options: establishmentOptions(catalog, draft.network, draft.region) },
    { field: 'customerType', label: 'Tipo de cliente', allLabel: 'Todos', options: catalog.customerTypes },
  ]
  // Os chips usam as opções completas do catálogo, para sempre achar o rótulo do valor aplicado.
  const chipOptions: Record<keyof ReportFilters, readonly ReportOption[]> = {
    period: catalog.periods, campaign: catalog.campaigns, category: catalog.categories, network: catalog.networks,
    region: catalog.regions, establishment: catalog.establishments, customerType: catalog.customerTypes,
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply()
  }

  function handleChange(field: keyof ReportFilters, value: string) {
    // A normalização zera Região/Estabelecimento que deixaram de combinar com a Rede.
    onDraftChange(normalizeReportFilters(catalog, { ...draft, [field]: value }))
  }

  return <section className="report-filters" aria-label="Filtros do relatório">
    <form className="report-filters-form" onSubmit={handleSubmit}>
      {fields.map(({ field, label, allLabel, options }) => <Select
        key={field}
        className="report-filter"
        label={`${label}:`}
        options={allLabel ? [{ value: allValue, label: allLabel }, ...options] : options}
        value={draft[field]}
        onChange={value => handleChange(field, String(value))}
      />)}
      <Button type="submit" className="report-filter-button" isDisabled={isBusy}>Aplicar filtros</Button>
      <Button type="button" variant="ghost" className="report-filter-clear" onPress={onClear}>Limpar filtros</Button>
    </form>
    <ul className="report-chips" aria-label="Filtros aplicados">
      {fields.map(({ field, label, allLabel }) => {
        const isDefault = applied[field] === defaultReportFilters[field]
        const valueLabel = applied[field] === allValue
          ? allLabel
          : chipOptions[field].find(option => option.value === applied[field])?.label ?? applied[field]
        return <li key={field} className="report-chip">
          <span>{label}: {valueLabel}</span>
          {!isDefault && <button type="button" aria-label={`Remover filtro ${label}: ${valueLabel}`} onClick={() => onRemoveFilter(field)}>
            <X size={12} aria-hidden="true" />
          </button>}
        </li>
      })}
    </ul>
  </section>
}
