import { http, HttpResponse } from 'msw'
import { parseMockJwt } from '../jwtUtils'

/** Rede da sessão do analista e do gestor nos mocks. */
export const mockNetworkId = '0199e3a0-0000-7000-8000-000000000001'

const createdAt = '2026-09-01T12:00:00Z'

interface MockNetwork { id: string; name: string; timeZone: string; isActive: boolean; createdAt: string }
interface MockRegion { id: string; networkId: string; name: string; isActive: boolean; createdAt: string }
interface MockEstablishment { id: string; regionId: string; code: string; name: string; channels: string[]; isActive: boolean; createdAt: string }
interface MockCategory { id: string; name: string; isActive: boolean; createdAt: string }
interface MockProduct { id: string; categoryId: string; code: string; name: string; isActive: boolean; createdAt: string }

interface RegistryState {
  networks: MockNetwork[]
  regions: MockRegion[]
  establishments: MockEstablishment[]
  categories: MockCategory[]
  products: MockProduct[]
}

function seed(): RegistryState {
  return {
    networks: [
      { id: mockNetworkId, name: 'Rede Exemplo', timeZone: 'America/Sao_Paulo', isActive: true, createdAt },
    ],
    regions: [
      { id: '0199e3a0-0000-7000-8000-000000000311', networkId: mockNetworkId, name: 'Sudeste', isActive: true, createdAt },
    ],
    establishments: [
      { id: '0199e3a0-0000-7000-8000-000000000321', regionId: '0199e3a0-0000-7000-8000-000000000311', code: '001', name: 'Loja Centro', channels: ['Physical'], isActive: true, createdAt },
    ],
    categories: [
      { id: '0199e3a0-0000-7000-8000-000000000301', name: 'Papelaria', isActive: true, createdAt },
    ],
    products: [
      { id: '0199e3a0-0000-7000-8000-000000000302', categoryId: '0199e3a0-0000-7000-8000-000000000301', code: 'CAD-1', name: 'Caderno', isActive: true, createdAt },
    ],
  }
}

/** Estado dos cadastros nos mocks. Os testes leem e preparam cenários por aqui. */
export const registryState: RegistryState = seed()
let sequence = 1

export function resetRegistryState() {
  Object.assign(registryState, seed())
  sequence = 1
}

function nextId() {
  const id = `0199e3a0-0000-7000-8000-0000000009${String(sequence).padStart(2, '0')}`
  sequence += 1
  return id
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function problem(status: number, detail: string, code: string) {
  return HttpResponse.json({ status, title: detail, detail, code }, { status })
}

function validation(field: string, message: string) {
  return HttpResponse.json(
    { status: 400, title: 'Um ou mais campos são inválidos.', code: 'VALIDATION_ERROR', errors: { [field]: [message] } },
    { status: 400 },
  )
}

const notFound = () => problem(404, 'Cadastro não encontrado.', 'NOT_FOUND')

/** Escrita é só do administrador. Leitura vale para os três papéis. */
function forbidWrite(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const payload = token ? parseMockJwt(token) : null
  if (!payload) return problem(401, 'Sessão inválida.', 'AUTH_UNAUTHORIZED')
  if (payload.role !== 'administrador') return problem(403, 'Seu perfil não pode alterar cadastros.', 'AUTH_FORBIDDEN_ROLE')
  return null
}

/** `activeOnly` ausente devolve todos; `true` só ativos; `false` só inativos. */
function byActive<T extends { isActive: boolean }>(items: T[], url: URL) {
  const activeOnly = url.searchParams.get('activeOnly')
  if (activeOnly === 'true') return items.filter(item => item.isActive)
  if (activeOnly === 'false') return items.filter(item => !item.isActive)
  return items
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null)
  return isRecord(body) ? body : {}
}

function text(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : ''
}

function same(a: string, b: string) {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0
}

function readChannels(body: Record<string, unknown>): string[] | Response {
  const channels = body.channels
  if (!Array.isArray(channels) || channels.length === 0) return validation('Channels', 'Informe ao menos um canal do estabelecimento.')
  if (channels.some(channel => channel !== 'Physical' && channel !== 'Virtual')) {
    return validation('Channels', "Tipo de canal inválido. Use 'Physical' ou 'Virtual'.")
  }
  if (new Set(channels).size !== channels.length) return validation('Channels', 'Os canais do estabelecimento não podem se repetir.')
  return channels.map(String)
}

function deactivateNetwork(network: MockNetwork) {
  network.isActive = false
  registryState.regions.filter(region => region.networkId === network.id).forEach(deactivateRegion)
}

function deactivateRegion(region: MockRegion) {
  region.isActive = false
  registryState.establishments.filter(store => store.regionId === region.id).forEach(store => { store.isActive = false })
}

function deactivateCategory(category: MockCategory) {
  category.isActive = false
  registryState.products.filter(product => product.categoryId === category.id).forEach(product => { product.isActive = false })
}

export const registryHandlers = [
  // Redes
  http.get('*/api/v1/networks', ({ request }) => HttpResponse.json(byActive(registryState.networks, new URL(request.url)))),
  http.post('*/api/v1/networks', async ({ request }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const body = await readBody(request)
    const name = text(body, 'name')
    const timeZone = text(body, 'timeZone')
    if (!name) return validation('Name', 'Informe o nome da rede.')
    if (!timeZone) return validation('TimeZone', 'Informe o fuso da rede.')
    if (registryState.networks.some(network => same(network.name, name))) {
      return problem(422, 'Já existe uma rede cadastrada com este nome.', 'NETWORK_NAME_TAKEN')
    }
    const network: MockNetwork = { id: nextId(), name, timeZone, isActive: true, createdAt }
    registryState.networks.push(network)
    return HttpResponse.json(network, { status: 201 })
  }),
  http.put('*/api/v1/networks/:id', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const network = registryState.networks.find(item => item.id === params.id)
    if (!network) return notFound()
    const body = await readBody(request)
    const name = text(body, 'name')
    if (!name) return validation('Name', 'Informe o nome da rede.')
    if (typeof body.isActive !== 'boolean') return validation('IsActive', 'Informe se a rede está ativa.')
    if (registryState.networks.some(item => item.id !== network.id && same(item.name, name))) {
      return problem(422, 'Já existe uma rede cadastrada com este nome.', 'NETWORK_NAME_TAKEN')
    }
    network.name = name
    network.timeZone = text(body, 'timeZone') || network.timeZone
    if (body.isActive) network.isActive = true
    else deactivateNetwork(network)
    return HttpResponse.json(network)
  }),
  http.delete('*/api/v1/networks/:id', ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const network = registryState.networks.find(item => item.id === params.id)
    if (!network) return notFound()
    deactivateNetwork(network)
    return new HttpResponse(null, { status: 204 })
  }),

  // Regiões
  http.get('*/api/v1/regions', ({ request }) => {
    const url = new URL(request.url)
    const networkId = url.searchParams.get('networkId')
    if (!networkId) return problem(400, 'Informe a rede.', 'VALIDATION_ERROR')
    return HttpResponse.json(byActive(registryState.regions.filter(region => region.networkId === networkId), url))
  }),
  http.post('*/api/v1/regions', async ({ request }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const body = await readBody(request)
    const networkId = text(body, 'networkId')
    const name = text(body, 'name')
    const network = registryState.networks.find(item => item.id === networkId)
    if (!network) return problem(422, 'Rede informada não encontrada', 'REGION_NETWORK_NOT_FOUND')
    if (!network.isActive) return problem(422, 'Rede informada está inativa', 'REGION_NETWORK_INACTIVE')
    if (!name) return validation('Name', 'Informe o nome da região.')
    if (registryState.regions.some(region => region.networkId === networkId && same(region.name, name))) {
      return problem(422, 'Já existe uma região com este nome nesta rede.', 'REGION_NAME_TAKEN')
    }
    const region: MockRegion = { id: nextId(), networkId, name, isActive: true, createdAt }
    registryState.regions.push(region)
    return HttpResponse.json(region, { status: 201 })
  }),
  http.put('*/api/v1/regions/:id', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const region = registryState.regions.find(item => item.id === params.id)
    if (!region) return notFound()
    const body = await readBody(request)
    const name = text(body, 'name')
    if (!name) return validation('Name', 'Informe o nome da região.')
    if (typeof body.isActive !== 'boolean') return validation('IsActive', 'Informe se a região está ativa.')
    const network = registryState.networks.find(item => item.id === region.networkId)
    if (body.isActive && network && !network.isActive) return problem(422, 'Rede informada está inativa', 'REGION_NETWORK_INACTIVE')
    if (registryState.regions.some(item => item.id !== region.id && item.networkId === region.networkId && same(item.name, name))) {
      return problem(422, 'Já existe uma região com este nome nesta rede.', 'REGION_NAME_TAKEN')
    }
    region.name = name
    if (body.isActive) region.isActive = true
    else deactivateRegion(region)
    return HttpResponse.json(region)
  }),
  http.delete('*/api/v1/regions/:id', ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const region = registryState.regions.find(item => item.id === params.id)
    if (!region) return notFound()
    deactivateRegion(region)
    return new HttpResponse(null, { status: 204 })
  }),

  // Lojas
  http.get('*/api/v1/establishments', ({ request }) => {
    const url = new URL(request.url)
    const regionId = url.searchParams.get('regionId')
    if (!regionId) return problem(400, 'Informe a região do estabelecimento.', 'VALIDATION_ERROR')
    return HttpResponse.json(byActive(registryState.establishments.filter(store => store.regionId === regionId), url))
  }),
  http.post('*/api/v1/establishments', async ({ request }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const body = await readBody(request)
    const regionId = text(body, 'regionId')
    const code = text(body, 'code')
    const name = text(body, 'name')
    const region = registryState.regions.find(item => item.id === regionId)
    if (!region) return problem(422, 'Região informada não encontrada', 'ESTABLISHMENT_REGION_NOT_FOUND')
    if (!region.isActive) return problem(422, 'Região informada está inativa', 'ESTABLISHMENT_REGION_INACTIVE')
    if (!code) return validation('Code', 'Informe o código do estabelecimento.')
    if (!name) return validation('Name', 'Informe o nome do estabelecimento.')
    const channels = readChannels(body)
    if (channels instanceof Response) return channels
    if (registryState.establishments.some(store => store.regionId === regionId && same(store.code, code))) {
      return problem(422, 'Já existe um estabelecimento com este código nesta região.', 'ESTABLISHMENT_CODE_TAKEN')
    }
    const store: MockEstablishment = { id: nextId(), regionId, code, name, channels, isActive: true, createdAt }
    registryState.establishments.push(store)
    return HttpResponse.json(store, { status: 201 })
  }),
  http.put('*/api/v1/establishments/:id', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const store = registryState.establishments.find(item => item.id === params.id)
    if (!store) return notFound()
    const body = await readBody(request)
    const code = text(body, 'code')
    const name = text(body, 'name')
    if (!code) return validation('Code', 'Informe o código do estabelecimento.')
    if (!name) return validation('Name', 'Informe o nome do estabelecimento.')
    if (typeof body.isActive !== 'boolean') return validation('IsActive', 'Informe se o estabelecimento está ativo.')
    const channels = readChannels(body)
    if (channels instanceof Response) return channels
    const region = registryState.regions.find(item => item.id === store.regionId)
    if (body.isActive && region && !region.isActive) return problem(422, 'Região informada está inativa', 'ESTABLISHMENT_REGION_INACTIVE')
    if (registryState.establishments.some(item => item.id !== store.id && item.regionId === store.regionId && same(item.code, code))) {
      return problem(422, 'Já existe um estabelecimento com este código nesta região.', 'ESTABLISHMENT_CODE_TAKEN')
    }
    Object.assign(store, { code, name, channels, isActive: body.isActive })
    return HttpResponse.json(store)
  }),
  http.delete('*/api/v1/establishments/:id', ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const store = registryState.establishments.find(item => item.id === params.id)
    if (!store) return notFound()
    store.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),

  // Categorias
  http.get('*/api/v1/categories', ({ request }) => HttpResponse.json(byActive(registryState.categories, new URL(request.url)))),
  http.post('*/api/v1/categories', async ({ request }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const name = text(await readBody(request), 'name')
    if (!name) return validation('Name', 'Informe o nome da categoria.')
    if (registryState.categories.some(category => same(category.name, name))) {
      return problem(422, 'Já existe uma categoria cadastrada com este nome.', 'CATEGORY_NAME_TAKEN')
    }
    const category: MockCategory = { id: nextId(), name, isActive: true, createdAt }
    registryState.categories.push(category)
    return HttpResponse.json(category, { status: 201 })
  }),
  http.put('*/api/v1/categories/:id', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const category = registryState.categories.find(item => item.id === params.id)
    if (!category) return notFound()
    const body = await readBody(request)
    const name = text(body, 'name')
    if (!name) return validation('Name', 'Informe o nome da categoria.')
    if (typeof body.isActive !== 'boolean') return validation('IsActive', 'Informe se a categoria está ativa.')
    if (registryState.categories.some(item => item.id !== category.id && same(item.name, name))) {
      return problem(422, 'Já existe uma categoria cadastrada com este nome.', 'CATEGORY_NAME_TAKEN')
    }
    category.name = name
    if (body.isActive) category.isActive = true
    else deactivateCategory(category)
    return HttpResponse.json(category)
  }),
  http.delete('*/api/v1/categories/:id', ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const category = registryState.categories.find(item => item.id === params.id)
    if (!category) return notFound()
    deactivateCategory(category)
    return new HttpResponse(null, { status: 204 })
  }),

  // Produtos
  http.get('*/api/v1/products', ({ request }) => {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId')
    const products = categoryId ? registryState.products.filter(product => product.categoryId === categoryId) : registryState.products
    return HttpResponse.json(byActive(products, url))
  }),
  http.post('*/api/v1/products', async ({ request }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const body = await readBody(request)
    const categoryId = text(body, 'categoryId')
    const code = text(body, 'code')
    const name = text(body, 'name')
    const category = registryState.categories.find(item => item.id === categoryId)
    if (!category) return problem(422, 'Categoria informada não encontrada', 'PRODUCT_CATEGORY_NOT_FOUND')
    if (!category.isActive) return problem(422, 'Categoria informada está inativa', 'PRODUCT_CATEGORY_INACTIVE')
    if (!code) return validation('Code', 'Informe o código do produto.')
    if (!name) return validation('Name', 'Informe o nome do produto.')
    if (registryState.products.some(product => same(product.code, code))) {
      return problem(422, 'Já existe produto com este identificador', 'PRODUCT_CODE_TAKEN')
    }
    const product: MockProduct = { id: nextId(), categoryId, code, name, isActive: true, createdAt }
    registryState.products.push(product)
    return HttpResponse.json(product, { status: 201 })
  }),
  http.put('*/api/v1/products/:id', async ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const product = registryState.products.find(item => item.id === params.id)
    if (!product) return notFound()
    const body = await readBody(request)
    const code = text(body, 'code')
    const name = text(body, 'name')
    if (!code) return validation('Code', 'Informe o código do produto.')
    if (!name) return validation('Name', 'Informe o nome do produto.')
    if (typeof body.isActive !== 'boolean') return validation('IsActive', 'Informe se o produto está ativo.')
    const category = registryState.categories.find(item => item.id === product.categoryId)
    if (body.isActive && category && !category.isActive) return problem(422, 'Categoria informada está inativa', 'PRODUCT_CATEGORY_INACTIVE')
    if (registryState.products.some(item => item.id !== product.id && same(item.code, code))) {
      return problem(422, 'Já existe produto com este identificador', 'PRODUCT_CODE_TAKEN')
    }
    Object.assign(product, { code, name, isActive: body.isActive })
    return HttpResponse.json(product)
  }),
  http.delete('*/api/v1/products/:id', ({ request, params }) => {
    const denied = forbidWrite(request)
    if (denied) return denied
    const product = registryState.products.find(item => item.id === params.id)
    if (!product) return notFound()
    product.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),
]
