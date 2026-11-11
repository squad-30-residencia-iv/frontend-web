import { authHandlers } from './auth'
import { satelliteHandlers } from './satellite'

export const handlers = [...authHandlers, ...satelliteHandlers]
