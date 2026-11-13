/** Escopos disponíveis para aplicações satélite. */
export type SatelliteScope = 'campaigns:read' | 'vouchers:issue' | 'vouchers:redeem'

/** Aplicação satélite retornada pela API (sem segredo). */
export interface SatelliteApp {
  id: string
  name: string
  clientId: string
  networkId: string
  scopes: readonly SatelliteScope[]
  active: boolean
  createdAt: string
}

/** Payload para criar uma aplicação satélite. */
export interface CreateSatelliteAppPayload {
  name: string
  clientId: string
  networkId: string
  scopes: SatelliteScope[]
}

/** Resposta de criação — inclui o segredo gerado uma única vez. */
export interface CreateSatelliteAppResponse {
  app: SatelliteApp
  clientSecret: string
}

/** Resposta de rotação de segredo — inclui o novo segredo gerado. */
export interface RotateSecretResponse {
  clientSecret: string
}
