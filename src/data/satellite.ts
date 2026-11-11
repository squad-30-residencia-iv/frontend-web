import type { SatelliteApp, SatelliteScope } from '../types/satellite'

/** Redes demonstrativas — substituir pelo serviço de redes na integração. */
export interface SatelliteNetwork {
  id: string
  name: string
}

export const satelliteNetworks: readonly SatelliteNetwork[] = [
  { id: 'net-001', name: 'Rede Centro-Sul' },
  { id: 'net-002', name: 'Rede Nordeste' },
  { id: 'net-003', name: 'Rede Digital' },
]

export const satelliteScopeOptions: readonly { value: SatelliteScope; label: string }[] = [
  { value: 'voucher:redeem', label: 'Resgatar voucher' },
  { value: 'voucher:read', label: 'Consultar voucher' },
  { value: 'campaign:read', label: 'Consultar campanha' },
]

/** Dados demonstrativos — lista retornada pela API GET /satellite/apps. */
export const mockSatelliteApps: SatelliteApp[] = [
  {
    id: 'sat-001',
    name: 'PDV Loja Centro',
    clientId: 'pdv-centro-001',
    networkId: 'net-001',
    scopes: ['voucher:redeem', 'voucher:read'],
    active: true,
    createdAt: '2026-09-15T10:30:00Z',
  },
  {
    id: 'sat-002',
    name: 'E-commerce Nordeste',
    clientId: 'ecom-ne-001',
    networkId: 'net-002',
    scopes: ['voucher:redeem', 'voucher:read', 'campaign:read'],
    active: true,
    createdAt: '2026-10-01T14:00:00Z',
  },
  {
    id: 'sat-003',
    name: 'Totem Shopping',
    clientId: 'totem-shopping-003',
    networkId: 'net-001',
    scopes: ['voucher:redeem'],
    active: false,
    createdAt: '2026-08-20T09:00:00Z',
  },
  {
    id: 'sat-004',
    name: 'App Digital',
    clientId: 'app-digital-001',
    networkId: 'net-003',
    scopes: ['voucher:read', 'campaign:read'],
    active: true,
    createdAt: '2026-10-10T16:45:00Z',
  },
]
