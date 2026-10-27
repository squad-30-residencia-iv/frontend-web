import { Dropdown } from '@heroui/react'
import { ChevronLeft, ChevronRight, EllipsisVertical } from 'lucide-react'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { auditOperationLabels, auditStatusLabels, formatAuditDateTime } from '../../data/auditRepository'
import type { AuditRecord } from '../../types/audit'

export const auditPageSize = 7

interface AuditTableProps {
  records: readonly AuditRecord[]
  page: number
  onPageChange: (page: number) => void
  onDetails: (record: AuditRecord) => void
  onClear: () => void
  hasRecords: boolean
}

export function AuditTable({ records, page, onPageChange, onDetails, onClear, hasRecords }: AuditTableProps) {
  const pageCount = Math.ceil(records.length / auditPageSize)
  const currentPage = Math.min(page, Math.max(1, pageCount))
  const visible = records.slice((currentPage - 1) * auditPageSize, currentPage * auditPageSize)
  const pages = [...new Set([1, 2, 3, currentPage - 1, currentPage, currentPage + 1, pageCount])]
    .filter(value => value > 0 && value <= pageCount).sort((a, b) => a - b)

  return <section className="audit-list" aria-label="Registros de auditoria">
    {visible.length === 0 ? <EmptyState
      title="Nenhum registro encontrado"
      description={hasRecords ? 'Tente outra busca ou combinação de filtros.' : 'Ainda não há operações registradas.'}
      action={hasRecords ? <Button variant="secondary" onPress={onClear}>Limpar filtros</Button> : undefined}
    /> : <div className="audit-table-scroll" tabIndex={0} role="region" aria-label="Tabela de auditoria com rolagem horizontal">
      <table className="audit-table">
        <caption className="audit-sr-only">Histórico de operações nas campanhas</caption>
        <thead><tr>
          {['Nome da campanha', 'Data/Hora', 'Responsável', 'Operação', 'Perfil', 'Status', 'Ações'].map(label => <th key={label} scope="col">{label}</th>)}
        </tr></thead>
        <tbody>{visible.map(record => <tr key={record.id}>
          <th scope="row">{record.campaignName}</th>
          <td className="audit-date"><time dateTime={record.occurredAt}>{formatAuditDateTime(record.occurredAt)}</time></td>
          <td>{record.responsibleName}</td>
          <td>{auditOperationLabels[record.operation]}</td>
          <td>{record.profile}</td>
          <td><span className={`audit-status audit-tone-${record.status}`}><span aria-hidden="true">● </span>{auditStatusLabels[record.status]}</span></td>
          <td><Dropdown>
            <Button
              className="audit-actions-button"
              variant="ghost"
              isIconOnly
              aria-label={`Ações de ${record.code}`}
              startIcon={EllipsisVertical}
            />
            <Dropdown.Popover>
              <Dropdown.Menu aria-label={`Ações de ${record.code}`}>
                <Dropdown.Item id="details" textValue="Ver detalhes" onAction={() => onDetails(record)}>Ver detalhes</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown></td>
        </tr>)}</tbody>
      </table>
    </div>}
    <footer className="audit-list-footer">
      <p role="status">Exibindo <strong>{visible.length}</strong> de <strong>{new Intl.NumberFormat('pt-BR').format(records.length)}</strong> registros</p>
      {pageCount > 1 && <nav aria-label="Paginação de auditoria">
        <Button isIconOnly variant="secondary" aria-label="Página anterior" startIcon={ChevronLeft}
          isDisabled={currentPage === 1} onPress={() => onPageChange(currentPage - 1)} />
        {pages.map((value, index) => <span className="audit-page-item" key={value}>
          {index > 0 && value - pages[index - 1] > 1 && <span aria-hidden="true">...</span>}
          <Button aria-label={`Página ${value}`} aria-current={value === currentPage ? 'page' : undefined}
            variant={value === currentPage ? 'primary' : 'secondary'} onPress={() => onPageChange(value)}>{value}</Button>
        </span>)}
        <Button isIconOnly variant="secondary" aria-label="Próxima página" startIcon={ChevronRight}
          isDisabled={currentPage === pageCount} onPress={() => onPageChange(currentPage + 1)} />
      </nav>}
    </footer>
  </section>
}
