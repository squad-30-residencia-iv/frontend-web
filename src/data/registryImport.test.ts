import { describe, expect, it } from 'vitest'
import { maxRegistryImportLines, parseRegistryImportLines, productCodeMaxLength, storeCodeMaxLength } from './registryImport'

describe('parseRegistryImportLines', () => {
  it('aceita traço, vírgula, ponto e vírgula e tab', () => {
    const text = ['CAN-1 — Caneta', 'LAP-2 - Lápis', 'BOR-3, Borracha', 'CLI-4; Clips', 'MAR-5\tMarca-texto'].join('\n')
    const parsed = parseRegistryImportLines(text, { codeMax: productCodeMaxLength })
    expect(parsed).toEqual({
      lines: [
        { code: 'CAN-1', name: 'Caneta' },
        { code: 'LAP-2', name: 'Lápis' },
        { code: 'BOR-3', name: 'Borracha' },
        { code: 'CLI-4', name: 'Clips' },
        { code: 'MAR-5', name: 'Marca-texto' },
      ],
    })
  })

  it('ignora linhas em branco e recusa lote vazio', () => {
    expect(parseRegistryImportLines(' \n\t\n ', { codeMax: 30 })).toEqual({
      error: 'Informe ao menos uma linha com código e nome.',
    })
  })

  it('recusa código repetido, limites e mais de 1.000 linhas', () => {
    expect(parseRegistryImportLines('A — Um\na — Dois', { codeMax: 30 })).toEqual({
      error: 'O código a aparece mais de uma vez no lote (linhas 1 e 2).',
    })
    expect(parseRegistryImportLines('SO-CODIGO', { codeMax: 30 })).toEqual({
      error: 'Informe o nome na linha 1.',
    })
    expect(parseRegistryImportLines(`${'X'.repeat(21)} — Loja`, { codeMax: storeCodeMaxLength })).toEqual({
      error: 'O código da linha 1 deve ter no máximo 20 caracteres.',
    })
    const overflow = Array.from({ length: maxRegistryImportLines + 1 }, (_, index) => `C${index} — Item ${index}`).join('\n')
    expect(parseRegistryImportLines(overflow, { codeMax: 30 })).toEqual({
      error: 'O lote aceita no máximo 1.000 linhas.',
    })
  })
})
