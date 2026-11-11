import { authHandlers } from './auth'
import { campaignHandlers } from './campaigns'
import { registryHandlers } from './registry'

export const handlers = [...authHandlers, ...campaignHandlers, ...registryHandlers]
