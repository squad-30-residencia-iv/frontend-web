import { api } from './api'
import { toProblemError } from './problemDetails'

export interface CustomerGroup {
  id: string
  networkId: string
  name: string
  isActive: boolean
  memberCount: number
}

const loadMessage = 'Não foi possível carregar os grupos.'
const saveMessage = 'Não foi possível gravar o grupo.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readGroup(value: unknown): CustomerGroup | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.isActive !== 'boolean') return null
  return {
    id: value.id,
    networkId: typeof value.networkId === 'string' ? value.networkId : '',
    name: value.name,
    isActive: value.isActive,
    memberCount: typeof value.memberCount === 'number' ? value.memberCount : 0,
  }
}

export async function fetchCustomerGroups(networkId: string, activeOnly?: boolean): Promise<CustomerGroup[]> {
  try {
    const { data } = await api.get<unknown>('/api/v1/customer-groups', {
      params: { networkId, ...(activeOnly === undefined ? {} : { activeOnly }) },
    })
    if (!Array.isArray(data)) throw new Error(loadMessage)
    return data.map(readGroup).filter((group): group is CustomerGroup => group !== null)
  } catch (error) {
    throw toProblemError(error, loadMessage)
  }
}

export async function createCustomerGroup(networkId: string, name: string): Promise<CustomerGroup> {
  try {
    const { data } = await api.post<unknown>('/api/v1/customer-groups', { networkId, name })
    const group = readGroup(data)
    if (!group) throw new Error(saveMessage)
    return group
  } catch (error) {
    throw toProblemError(error, saveMessage)
  }
}

export async function replaceCustomerGroupMembers(id: string, documents: string[]): Promise<CustomerGroup> {
  try {
    const { data } = await api.put<unknown>(`/api/v1/customer-groups/${id}/members`, { documents })
    const group = readGroup(data)
    if (!group) throw new Error(saveMessage)
    return group
  } catch (error) {
    throw toProblemError(error, saveMessage)
  }
}

export async function activateCustomerGroup(id: string, name: string): Promise<CustomerGroup> {
  try {
    const { data } = await api.put<unknown>(`/api/v1/customer-groups/${id}`, { name, isActive: true })
    const group = readGroup(data)
    if (!group) throw new Error(saveMessage)
    return group
  } catch (error) {
    throw toProblemError(error, saveMessage)
  }
}

export async function inactivateCustomerGroup(id: string): Promise<void> {
  try {
    await api.delete(`/api/v1/customer-groups/${id}`)
  } catch (error) {
    throw toProblemError(error, saveMessage)
  }
}

export async function previewCustomerGroups(networkId: string, groupIds: string[]): Promise<number> {
  try {
    const { data } = await api.post<unknown>('/api/v1/customer-groups/preview', { networkId, groupIds })
    if (!isRecord(data) || typeof data.uniqueCustomerCount !== 'number') return 0
    return data.uniqueCustomerCount
  } catch (error) {
    throw toProblemError(error, loadMessage)
  }
}

/** CPF com ou sem máscara. Sequência repetida não vale. */
export function parseCpfList(text: string): { documents: string[] } | { error: string } {
  const documents: string[] = []
  const invalid: number[] = []
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return { error: 'Informe ao menos um CPF.' }
  if (lines.length > 10000) return { error: 'A lista pode ter no máximo 10.000 CPFs.' }
  lines.forEach((line, index) => {
    const digits = line.replace(/\D/g, '')
    if (line.replace(/[\d.\-\s]/g, '') !== '' || !isValidCpf(digits)) invalid.push(index + 1)
    else documents.push(digits)
  })
  if (invalid.length) return { error: `CPFs inválidos nas linhas: ${invalid.slice(0, 20).join(', ')}.` }
  return { documents: [...new Set(documents)] }
}

function isValidCpf(digits: string) {
  if (digits.length !== 11 || digits.split('').every(digit => digit === digits[0])) return false
  const check = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index += 1) sum += Number(digits[index]) * (length + 1 - index)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10])
}
