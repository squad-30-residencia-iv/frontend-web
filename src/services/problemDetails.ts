import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

/** Converte a falha de uma chamada em Error com a mensagem que a tela mostra. */
export function toProblemError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) return new Error(problemMessage(error.response?.data, fallback))
  if (error instanceof Error) return error
  return new Error(fallback)
}
