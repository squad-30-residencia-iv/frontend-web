import { delay, http, HttpResponse } from 'msw'
import { mockSatelliteApps } from '../../data/satellite'
import type {
  CreateSatelliteAppPayload,
  CreateSatelliteAppResponse,
  RotateSecretResponse,
  SatelliteApp,
  SatelliteScope,
} from '../../types/satellite'
import { mockConfig } from '../mockConfig'

const VALID_SCOPES: readonly SatelliteScope[] = ['campaigns:read', 'vouchers:issue', 'vouchers:redeem']

let apps = [...mockSatelliteApps]
let nextId = apps.length + 1

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'sec_'
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function resetSatelliteMockState() {
  apps = [...mockSatelliteApps]
  nextId = apps.length + 1
}

export const satelliteHandlers = [
  // Lista aplicações (filtrável por networkId via query param)
  http.get('*/api/v1/satellite/apps', async ({ request }) => {
    if (mockConfig.latencyMs > 0) await delay(mockConfig.latencyMs)

    const url = new URL(request.url)
    const networkId = url.searchParams.get('networkId')

    let result: SatelliteApp[]
    if (networkId) {
      result = apps.filter(app => app.networkId === networkId)
    } else {
      result = [...apps]
    }

    return HttpResponse.json(result, { status: 200 })
  }),

  // Cria aplicação — retorna o segredo uma única vez
  http.post('*/api/v1/satellite/apps', async ({ request }) => {
    if (mockConfig.latencyMs > 0) await delay(mockConfig.latencyMs)

    let body: Partial<CreateSatelliteAppPayload>
    try {
      body = (await request.json()) as Partial<CreateSatelliteAppPayload>
    } catch {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: 'Corpo da requisição inválido.' },
        { status: 400 },
      )
    }

    const { name, clientId, networkId, scopes } = body

    if (!name || !clientId || !networkId || !scopes || !scopes.length) {
      return HttpResponse.json(
        { code: 'VALIDATION_FAILED', message: 'Todos os campos são obrigatórios.' },
        { status: 422 },
      )
    }

    if (!scopes.every(s => VALID_SCOPES.includes(s))) {
      return HttpResponse.json(
        { code: 'VALIDATION_FAILED', message: 'Escopo inválido.' },
        { status: 422 },
      )
    }

    if (apps.some(a => a.clientId === clientId)) {
      return HttpResponse.json(
        { code: 'CONFLICT', message: 'Já existe uma aplicação com este clientId.' },
        { status: 409 },
      )
    }

    const app: SatelliteApp = {
      id: `sat-${String(nextId++).padStart(3, '0')}`,
      name,
      clientId,
      networkId,
      scopes,
      active: true,
      createdAt: new Date().toISOString(),
    }

    apps.push(app)

    const response: CreateSatelliteAppResponse = {
      app,
      clientSecret: generateSecret(),
    }

    return HttpResponse.json(response, { status: 201 })
  }),

  // Inativar aplicação
  http.patch('*/api/v1/satellite/apps/:appId/deactivate', async ({ params }) => {
    if (mockConfig.latencyMs > 0) await delay(mockConfig.latencyMs)

    const app = apps.find(a => a.id === params.appId)
    if (!app) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Aplicação não encontrada.' },
        { status: 404 },
      )
    }

    app.active = false
    return HttpResponse.json(app, { status: 200 })
  }),

  // Rotacionar segredo
  http.post('*/api/v1/satellite/apps/:appId/rotate-secret', async ({ params }) => {
    if (mockConfig.latencyMs > 0) await delay(mockConfig.latencyMs)

    const app = apps.find(a => a.id === params.appId)
    if (!app) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Aplicação não encontrada.' },
        { status: 404 },
      )
    }

    const response: RotateSecretResponse = {
      clientSecret: generateSecret(),
    }

    return HttpResponse.json(response, { status: 200 })
  }),
]
