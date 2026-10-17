import { z } from 'zod'

// Mantém os nomes dos campos usados para mensagens e foco dos formulários.
export function createFormSchema<Value>(
  isValue: (value: unknown) => value is Value,
  collectErrors: (value: Value) => Partial<Record<string, string>>,
) {
  return z.custom<Value>(isValue, 'Dados do formulário inválidos.').superRefine((value, context) => {
    for (const [field, message] of Object.entries(collectErrors(value))) {
      if (message) context.addIssue({ code: 'custom', path: [field], message })
    }
  })
}

export function formErrors<Value>(schema: z.ZodType<Value>, value: Value): Partial<Record<string, string>> {
  const result = schema.safeParse(value)
  if (result.success) return {}

  const errors: Partial<Record<string, string>> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form')
    errors[field] ??= issue.message
  }
  return errors
}
