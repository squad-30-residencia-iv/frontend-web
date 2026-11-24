import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Códigos recusados em 422 de alvos (`CAMPAIGN_ITEM_PRODUCT_CODE_*`). */
export function problemCodes(data: unknown): string[] {
  if (!isRecord(data) || !Array.isArray(data.codes)) return []
  return data.codes.filter((code): code is string => typeof code === 'string' && code.trim() !== '')
}

/** Mensagem de um ProblemDetails: `detail` ou, sem ele, a primeira mensagem de `errors`. */
export function problemMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  if (!isRecord(data.errors)) return fallback
  for (const value of Object.values(data.errors)) {
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0]
  }
  return fallback
}

export class ApiProblemError extends Error {
  readonly codes: string[]

  constructor(message: string, codes: string[] = []) {
    super(message)
    this.name = 'ApiProblemError'
    this.codes = codes
  }
}

/** Converte a falha de uma chamada em Error com a mensagem que a tela mostra. */
export function toProblemError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    const message = problemMessage(data, fallback)
    const codes = problemCodes(data)
    if (codes.length) return new ApiProblemError(`${message} Códigos: ${codes.join(', ')}.`, codes)
    return new Error(message)
  }
  if (error instanceof Error) return error
  return new Error(fallback)
}
