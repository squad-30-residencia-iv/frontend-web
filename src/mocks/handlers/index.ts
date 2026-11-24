import { authHandlers } from './auth'
import { campaignHandlers } from './campaigns'
import { portalReadHandlers } from './portalReads'
import { customerGroupHandlers } from './customerGroups'
import { registryHandlers } from './registry'
import { satelliteHandlers } from './satellite'

export const handlers = [
  ...authHandlers,
  ...campaignHandlers,
  ...portalReadHandlers,
  ...registryHandlers,
  ...customerGroupHandlers,
  ...satelliteHandlers,
]
