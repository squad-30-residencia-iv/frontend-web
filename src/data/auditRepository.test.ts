import { afterEach, describe, expect, it, vi } from 'vitest'
import { auditRecords, emptyAuditFilters, filterAuditRecords, formatAuditDateTime, getAuditSummary } from './auditRepository'
import { createAuditCsv, downloadAuditCsv } from './auditExport'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Repositório local de auditoria', () => {
  it('mantém totais coerentes, IDs únicos e dados operacionais demonstrativos', () => {
    expect(getAuditSummary(auditRecords)).toEqual({ total: 80, campaigns: 8, users: 3, critical: 45 })
    expect(new Set(auditRecords.map(item => item.id)).size).toBe(80)
    expect(auditRecords[0].campaignName).toBe('Black Friday 2024')
    expect(auditRecords.some(item => item.blockingReason)).toBe(true)
    expect(auditRecords.some(item => item.priorityAlerts?.length)).toBe(true)
    expect(auditRecords.some(item => item.technicalFailure)).toBe(true)
  })

  it('busca campanha/código/responsável sem distinguir caixa ou acentos e combina filtros', () => {
    expect(filterAuditRecords(auditRecords, { ...emptyAuditFilters, search: '  aud-0001 ' }).map(item => item.id)).toEqual(['audit-1'])
    expect(filterAuditRecords(auditRecords, { ...emptyAuditFilters, search: 'maes' }).every(item => item.campaignName === 'Dia das Mães Premiado')).toBe(true)
    const filtered = filterAuditRecords(auditRecords, { ...emptyAuditFilters, search: 'MARIA', responsible: 'maria', operation: 'block' })
    expect(filtered).toHaveLength(15)
    expect(filtered.every(item => item.operation === 'block' && item.responsibleId === 'maria')).toBe(true)
  })

  it('filtra o período inclusivo sem incluir datas futuras ou alterar os dados', () => {
    const records = ['2026-10-01', '2026-10-30', '2026-09-30', '2026-10-31'].map((date, index) => ({
      ...auditRecords[0], id: String(index), occurredAt: `${date}T14:30:00-03:00`,
    }))
    const before = JSON.stringify(records)
    expect(filterAuditRecords(records, { ...emptyAuditFilters, period: '30' }, new Date(2026, 9, 30)).map(item => item.id)).toEqual(['0', '1'])
    expect(JSON.stringify(records)).toBe(before)
    expect(formatAuditDateTime(auditRecords[0].occurredAt)).toBe('20/11 às 14:30')
    expect(formatAuditDateTime(auditRecords[0].occurredAt, true)).toBe('20/11/2024 às 14:30')
  })
})

describe('Exportação CSV', () => {
  it('exporta UTF-8 com BOM, cabeçalhos, detalhes e somente os registros recebidos', () => {
    const csv = createAuditCsv([auditRecords[3], auditRecords[4], auditRecords[5]])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv.split('\r\n')).toHaveLength(4)
    expect(csv).toContain('"Motivo de bloqueio"')
    expect(csv).toContain('Limite de emissão excedido')
    expect(csv).toContain('Revisão prioritária')
    expect(csv).toContain('DEMO-VALIDATION')
    expect(csv).not.toContain('AUD-0001')
  })

  it('escapa aspas, delimitadores, quebras de linha e neutraliza fórmulas', () => {
    const csv = createAuditCsv([{ ...auditRecords[0], campaignName: '=SOMA(1;2)', responsibleName: 'Nome "teste"; linha\nnova' }])
    expect(csv).toContain('"\'=SOMA(1;2)"')
    expect(csv).toContain('"Nome ""teste""; linha\nnova"')
    expect(createAuditCsv([]).split('\r\n')).toHaveLength(1)
  })

  it('gera o download e libera o URL e o elemento temporário', () => {
    const createObjectURL = vi.fn(() => 'blob:audit-csv')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    })
    let filename = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
    downloadAuditCsv(auditRecords.slice(0, 2))
    expect(filename).toBe('historico-auditoria.csv')
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:audit-csv')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
