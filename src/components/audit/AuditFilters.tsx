import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { auditOperationLabels } from '../../data/auditRepository'
import type { AuditFilters as Filters, AuditRecord } from '../../types/audit'

interface AuditFiltersProps {
  filters: Filters
  records: readonly AuditRecord[]
  onChange: (field: keyof Filters, value: string) => void
  onApply: (event: FormEvent<HTMLFormElement>) => void
  onClear: () => void
}

export function AuditFilters({ filters, records, onChange, onApply, onClear }: AuditFiltersProps) {
  const users = [...new Map(records.map(item => [item.responsibleId, { value: item.responsibleId, label: item.responsibleName }])).values()]
  return <form className="audit-filters" aria-label="Filtros de auditoria" onSubmit={onApply}>
    <Input
      className="audit-search"
      label="Buscar por campanha, código ou responsável"
      placeholder="Buscar por campanha, código ou responsável..."
      icon={Search}
      value={filters.search}
      onChange={value => onChange('search', value)}
    />
    <Select
      className="audit-filter"
      label="Operação:"
      options={[{ value: 'all', label: 'Todos' }, ...Object.entries(auditOperationLabels).map(([value, label]) => ({ value, label }))]}
      value={filters.operation}
      onChange={value => onChange('operation', String(value))}
    />
    <Select
      className="audit-filter"
      label="Responsável:"
      options={[{ value: 'all', label: 'Todos' }, ...users]}
      value={filters.responsible}
      onChange={value => onChange('responsible', String(value))}
    />
    <Select
      className="audit-filter"
      label="Período:"
      options={[{ value: 'all', label: 'Todos' }, { value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' }]}
      value={filters.period}
      onChange={value => onChange('period', String(value))}
    />
    <Button className="audit-filter-button" type="submit">Filtrar</Button>
    <Button className="audit-clear" type="button" variant="ghost" onPress={onClear}>Limpar filtros</Button>
  </form>
}
