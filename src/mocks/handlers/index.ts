import { authHandlers } from './auth'
import { campaignHandlers } from './campaigns'

export const handlers = [...authHandlers, ...campaignHandlers]
