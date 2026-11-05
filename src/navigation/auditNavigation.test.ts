import { afterEach, describe, expect, it } from 'vitest'
import { openAuditOperation, readAuditListState, returnToAudit, type AuditListState } from './auditNavigation'
import { emptyAuditFilters } from '../data/auditRepository'

afterEach(() => window.history.replaceState(null, '', '/'))

describe('Contexto de navegação de auditoria', () => {
  it('valida o estado desconhecido e rejeita páginas/filtros inválidos', () => {
    window.history.replaceState({ auditList: { filters: emptyAuditFilters, applied: emptyAuditFilters, page: -1 } }, '', '/auditoria')
    expect(readAuditListState()).toBeNull()
    window.history.replaceState({ auditList: { filters: {}, applied: {}, page: 1 } }, '', '/auditoria')
    expect(readAuditListState()).toBeNull()
  })

  it('guarda apenas o contexto da lista e preserva o ID codificado na rota', () => {
    const state: AuditListState = { filters: emptyAuditFilters, applied: emptyAuditFilters, page: 2 }
    window.history.replaceState(null, '', '/auditoria')
    openAuditOperation('id com espaço', state)
    expect(window.location.pathname).toBe('/auditoria/id%20com%20espa%C3%A7o')
    expect(readAuditListState()).toEqual(state)
    returnToAudit()
    expect(window.location.pathname).toBe('/auditoria')
    expect(readAuditListState()).toEqual(state)
  })
})
