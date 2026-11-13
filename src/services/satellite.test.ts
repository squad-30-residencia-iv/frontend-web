import { beforeEach, describe, expect, it } from 'vitest'
import { resetSatelliteMockState } from '../mocks/handlers/satellite'
import {
  createSatelliteApp,
  deactivateSatelliteApp,
  fetchSatelliteApps,
  rotateSatelliteSecret,
} from './satellite'

describe('satellite service', () => {
  beforeEach(() => {
    resetSatelliteMockState()
  })

  it('fetchSatelliteApps retorna lista filtrada por networkId', async () => {
    const apps = await fetchSatelliteApps('net-001')
    expect(apps.length).toBeGreaterThan(0)
    expect(apps.every(a => a.networkId === 'net-001')).toBe(true)
  })

  it('createSatelliteApp cadastra aplicação e retorna segredo uma única vez', async () => {
    const payload = {
      name: 'Novo PDV Teste',
      clientId: 'pdv-teste-999',
      networkId: 'net-001',
      scopes: ['vouchers:redeem' as const, 'vouchers:issue' as const],
    }

    const response = await createSatelliteApp(payload)

    expect(response.app.id).toBeDefined()
    expect(response.app.name).toBe(payload.name)
    expect(response.app.clientId).toBe(payload.clientId)
    expect(response.app.active).toBe(true)
    expect(response.clientSecret).toBeDefined()
    expect(response.clientSecret.startsWith('sec_')).toBe(true)
  })

  it('deactivateSatelliteApp inativa aplicação com sucesso', async () => {
    const deactivated = await deactivateSatelliteApp('sat-001')
    expect(deactivated.id).toBe('sat-001')
    expect(deactivated.active).toBe(false)

    // Consulta novamente e confirma que active é false
    const apps = await fetchSatelliteApps('net-001')
    const updated = apps.find(a => a.id === 'sat-001')
    expect(updated?.active).toBe(false)
  })

  it('rotateSatelliteSecret gera novo segredo para a aplicação', async () => {
    const response = await rotateSatelliteSecret('sat-001')
    expect(response.clientSecret).toBeDefined()
    expect(response.clientSecret.startsWith('sec_')).toBe(true)
  })
})
