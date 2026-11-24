export const maxRegistryImportLines = 1000
export const productCodeMaxLength = 30
export const storeCodeMaxLength = 20
export const registryNameMaxLength = 150

export interface RegistryImportLine {
  code: string
  name: string
}

export type RegistryImportKind = 'product' | 'store'

export interface RegistryImportLimits {
  codeMax: number
  nameMax?: number
}

const lineSeparator = /\s+[—–-]\s+|[;\t,]/

export function codeMaxForKind(kind: RegistryImportKind): number {
  return kind === 'product' ? productCodeMaxLength : storeCodeMaxLength
}

function splitLine(line: string): RegistryImportLine {
  const match = lineSeparator.exec(line)
  if (!match) return { code: line.trim(), name: '' }
  return {
    code: line.slice(0, match.index).trim(),
    name: line.slice(match.index + match[0].length).trim(),
  }
}

/**
 * Lê linhas `CODIGO — Nome` (também `,` / `;` / tab / hífen).
 * Linhas em branco são ignoradas. Recusa lote vazio, acima de 1.000, campos vazios, limites e código repetido.
 */
export function parseRegistryImportLines(
  text: string,
  limits: RegistryImportLimits,
): { lines: RegistryImportLine[] } | { error: string } {
  const nameMax = limits.nameMax ?? registryNameMaxLength
  const lines: RegistryImportLine[] = []
  const seen = new Map<string, number>()
  const raw = text.split(/\r?\n/)

  for (let index = 0; index < raw.length; index += 1) {
    const source = raw[index].trim()
    if (!source) continue
    if (lines.length >= maxRegistryImportLines) {
      return { error: 'O lote aceita no máximo 1.000 linhas.' }
    }

    const lineNumber = index + 1
    const { code, name } = splitLine(source)
    if (!code) return { error: `Informe o código na linha ${lineNumber}.` }
    if (!name) return { error: `Informe o nome na linha ${lineNumber}.` }
    if (code.length > limits.codeMax) {
      return { error: `O código da linha ${lineNumber} deve ter no máximo ${limits.codeMax} caracteres.` }
    }
    if (name.length > nameMax) {
      return { error: `O nome da linha ${lineNumber} deve ter no máximo ${nameMax} caracteres.` }
    }

    const previous = lines.find(item => item.code.localeCompare(code, 'pt-BR', { sensitivity: 'base' }) === 0)
    if (previous) {
      const first = seen.get(previous.code) ?? lineNumber
      return { error: `O código ${code} aparece mais de uma vez no lote (linhas ${first} e ${lineNumber}).` }
    }
    seen.set(code, lineNumber)
    lines.push({ code, name })
  }

  if (lines.length === 0) return { error: 'Informe ao menos uma linha com código e nome.' }
  return { lines }
}
