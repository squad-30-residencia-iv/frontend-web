import type { AuditFilters, AuditOperation, AuditRecord, AuditStatus } from '../types/audit'

export const auditOperationLabels: Record<AuditOperation, string> = {
  edit: 'Edição', approve: 'Aprovação', pause: 'Pausa', block: 'Bloqueio',
  'priority-alert': 'Alerta prioritário', 'technical-failure': 'Falha técnica',
}

export const auditStatusLabels: Record<AuditStatus, string> = {
  active: 'Ativa', scheduled: 'Agendada', ended: 'Encerrada', blocked: 'Bloqueada', warning: 'Alerta', failed: 'Falha',
}

export const emptyAuditFilters: AuditFilters = { search: '', operation: 'all', responsible: 'all', period: 'all' }

const campaigns = [
  'Black Friday 2024', 'Dia das Mães Premiado', 'Volta às Aulas Kids', 'Aniversário da Loja',
  'Liquidação de Verão', 'Natal Premiado', 'Semana do Consumidor', 'Campanha demonstrativa',
]
const responsibleUsers = [
  { id: 'maria', name: 'Maria Eduarda Silva', profile: 'Analista' },
  { id: 'roberto', name: 'Roberto Feitosa', profile: 'Gestor' },
  { id: 'leandro', name: 'Leandro Costa', profile: 'Analista' },
]
const initialDates = ['2024-11-20T14:30:00-03:00', '2024-05-01T17:03:00-03:00', '2024-01-10T13:40:00-03:00']
const operations: readonly AuditOperation[] = ['edit', 'approve', 'pause']
const criticalOperations: readonly AuditOperation[] = ['block', 'priority-alert', 'technical-failure']
const operationStatus: Record<AuditOperation, AuditStatus> = {
  edit: 'active', approve: 'scheduled', pause: 'ended', block: 'blocked', 'priority-alert': 'warning', 'technical-failure': 'failed',
}

// O conteúdo além das três linhas do protótipo é demonstrativo e determinístico.
export const auditRecords: readonly AuditRecord[] = Array.from({ length: 80 }, (_, index) => {
  const number = index + 1
  const user = responsibleUsers[index % responsibleUsers.length]
  const critical = index >= 3 && index < 48
  const operation = critical ? criticalOperations[(index - 3) % criticalOperations.length] : operations[index % operations.length]
  return {
    id: `audit-${number}`, code: `AUD-${String(number).padStart(4, '0')}`,
    campaignId: `campaign-${index % campaigns.length + 1}`, campaignName: campaigns[index % campaigns.length],
    occurredAt: initialDates[index] ?? `2026-10-${String(index % 25 + 1).padStart(2, '0')}T14:30:00-03:00`,
    responsibleId: user.id, responsibleName: user.name, profile: user.profile,
    operation, status: operationStatus[operation], critical,
    changes: operation === 'edit' ? [{ field: 'Nome da campanha', before: 'Campanha em preparação', after: campaigns[index % campaigns.length] }]
      : operation === 'approve' ? [{ field: 'Status', before: 'Rascunho', after: 'Agendada' }]
        : operation === 'pause' ? [{ field: 'Emissão de vouchers', before: 'Habilitada', after: 'Pausada' }] : [],
    ...(operation === 'block' ? { blockingReason: 'Limite de emissão excedido na validação demonstrativa.' } : {}),
    ...(operation === 'priority-alert' ? { priorityAlerts: ['Volume de operações acima do limite demonstrativo.', 'Revisão prioritária solicitada ao gestor.'] } : {}),
    ...(operation === 'technical-failure' ? { technicalFailure: { code: 'DEMO-VALIDATION', message: 'Falha técnica simulada ao validar a configuração. Nenhuma alteração foi aplicada.' } } : {}),
  }
})

// Fronteira local injetável, sem endpoint, rede ou atraso artificial.
export function loadAuditRecords(): Promise<readonly AuditRecord[]> {
  return Promise.resolve(auditRecords)
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function filterAuditRecords(items: readonly AuditRecord[], filters: AuditFilters, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(today)
  if (filters.period !== 'all') start.setDate(start.getDate() - Number(filters.period) + 1)
  const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const query = normalize(filters.search)
  return items.filter(item => {
    const matchesSearch = [item.campaignName, item.code, item.responsibleName].some(value => normalize(value).includes(query))
    const date = item.occurredAt.slice(0, 10)
    const matchesPeriod = filters.period === 'all' || (date >= localDate(start) && date <= localDate(today))
    return matchesSearch && matchesPeriod
      && (filters.operation === 'all' || item.operation === filters.operation)
      && (filters.responsible === 'all' || item.responsibleId === filters.responsible)
  })
}

export function getAuditSummary(items: readonly AuditRecord[]) {
  return {
    total: items.length,
    campaigns: new Set(items.map(item => item.campaignId)).size,
    users: new Set(items.map(item => item.responsibleId)).size,
    critical: items.filter(item => item.critical).length,
  }
}

export function formatAuditDateTime(value: string, includeYear = false) {
  const date = new Date(value)
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', ...(includeYear ? { year: 'numeric' } as const : {}), timeZone: 'America/Sao_Paulo',
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(date)
  return `${day} às ${time}`
}
