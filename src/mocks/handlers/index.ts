import { authHandlers } from './auth'
import { campaignHandlers } from './campaigns'
import { registryHandlers } from './registry'
import { satelliteHandlers } from './satellite'

export const handlers = [...authHandlers, ...campaignHandlers, ...registryHandlers, ...satelliteHandlers]
