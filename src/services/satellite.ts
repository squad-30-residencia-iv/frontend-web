import { api } from './api'
import type {
  CreateSatelliteAppPayload,
  CreateSatelliteAppResponse,
  RotateSecretResponse,
  SatelliteApp,
} from '../types/satellite'

/** Lista aplicações da rede informada. */
export async function fetchSatelliteApps(networkId: string): Promise<SatelliteApp[]> {
  const { data } = await api.get<SatelliteApp[]>('/api/v1/satellite/apps', {
    params: { networkId },
  })
  return data
}

/** Cria aplicação satélite — retorna app + segredo (exibido uma única vez). */
export async function createSatelliteApp(
  payload: CreateSatelliteAppPayload,
): Promise<CreateSatelliteAppResponse> {
  const { data } = await api.post<CreateSatelliteAppResponse>('/api/v1/satellite/apps', payload)
  return data
}

/** Inativa uma aplicação satélite. */
export async function deactivateSatelliteApp(appId: string): Promise<SatelliteApp> {
  const { data } = await api.patch<SatelliteApp>(`/api/v1/satellite/apps/${appId}/deactivate`)
  return data
}

/** Rotaciona o segredo — retorna o novo (exibido uma única vez). */
export async function rotateSatelliteSecret(appId: string): Promise<RotateSecretResponse> {
  const { data } = await api.post<RotateSecretResponse>(
    `/api/v1/satellite/apps/${appId}/rotate-secret`,
  )
  return data
}
