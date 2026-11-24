import { http, HttpResponse } from 'msw'
import { parseMockJwt } from '../jwtUtils'

interface MockGroup {
  id: string
  networkId: string
  name: string
  isActive: boolean
  documents: string[]
}

export const customerGroupState: { groups: MockGroup[] } = { groups: [] }
let sequence = 1

export function resetCustomerGroups() {
  customerGroupState.groups = []
  sequence = 1
}

function problem(status: number, detail: string, code: string) {
  return HttpResponse.json({ status, title: detail, detail, code }, { status })
}

function forbidWrite(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const payload = token ? parseMockJwt(token) : null
  if (!payload) return problem(401, 'Sessão inválida.', 'AUTH_UNAUTHORIZED')
  if (payload.role !== 'administrador') return problem(403, 'Seu perfil não pode alterar grupos.', 'AUTH_FORBIDDEN_ROLE')
  return null
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

function readDocuments(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return problem(400, 'Informe os CPFs dos clientes.', 'VALIDATION_ERROR')
  const documents: string[] = []
  const invalid: number[] = []
  value.forEach((item, index) => {
    const raw = typeof item === 'string' ? item : ''
    const digits = raw.replace(/\D/g, '')
    if (!isValidCpf(digits)) invalid.push(index + 1)
    else documents.push(digits)
  })
  if (invalid.length) return problem(400, `CPFs inválidos nas posições: ${invalid.join(', ')}.`, 'VALIDATION_ERROR')
  return [...new Set(documents)]
}

function bodyOf(group: MockGroup) {
  return { id: group.id, networkId: group.networkId, name: group.name, isActive: group.isActive, memberCount: group.documents.length, createdAt: '2026-09-01T12:00:00Z' }
}

export const customerGroupHandlers = [
  http.get('*/api/v1/customer-groups', ({ request }) => {
    const networkId = new URL(request.url).searchParams.get('networkId')
    const activeOnly = new URL(request.url).searchParams.get('activeOnly')
    return HttpResponse.json(customerGroupState.groups
      .filter(group => group.networkId === networkId
        && (activeOnly === 'true' ? group.isActive : activeOnly === 'false' ? !group.isActive : true))
      .map(bodyOf))
  }),
  http.post('*/api/v1/customer-groups/preview', async ({ request }) => {
    const body = await request.json() as { groupIds?: string[] }
    const ids = new Set(body.groupIds ?? [])
    const documents = new Set(customerGroupState.groups.filter(group => ids.has(group.id) && group.isActive).flatMap(group => group.documents))
    return HttpResponse.json({ uniqueCustomerCount: documents.size })
  }),
  http.post('*/api/v1/customer-groups', async ({ request }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const body = await request.json() as { networkId?: string; name?: string }
    const name = body.name?.trim() ?? ''
    if (!name) return problem(400, 'Informe o nome do grupo.', 'VALIDATION_ERROR')
    const group: MockGroup = { id: `group-${sequence++}`, networkId: body.networkId ?? '', name, isActive: true, documents: [] }
    customerGroupState.groups.push(group)
    return HttpResponse.json(bodyOf(group), { status: 201 })
  }),
  http.put('*/api/v1/customer-groups/:id', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const group = customerGroupState.groups.find(item => item.id === params.id)
    if (!group) return problem(404, 'Grupo informado não encontrado.', 'NOT_FOUND')
    const body = await request.json() as { name?: string; isActive?: boolean }
    const name = body.name?.trim() ?? ''
    if (!name || typeof body.isActive !== 'boolean') return problem(400, 'Informe o nome e se o grupo está ativo.', 'VALIDATION_ERROR')
    group.name = name
    group.isActive = body.isActive
    return HttpResponse.json(bodyOf(group))
  }),
  http.put('*/api/v1/customer-groups/:id/members', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const group = customerGroupState.groups.find(item => item.id === params.id)
    if (!group) return problem(404, 'Grupo informado não encontrado.', 'NOT_FOUND')
    const body = await request.json() as { documents?: unknown }
    const documents = readDocuments(body.documents)
    if (documents instanceof Response) return documents
    group.documents = documents
    return HttpResponse.json(bodyOf(group))
  }),
  http.delete('*/api/v1/customer-groups/:id', ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const group = customerGroupState.groups.find(item => item.id === params.id)
    if (!group) return problem(404, 'Grupo informado não encontrado.', 'NOT_FOUND')
    group.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),
  http.put('*/api/v1/campaigns/:id/customer-groups', () => HttpResponse.json({ customerGroups: [], uniqueCustomerCount: 0 })),
]
