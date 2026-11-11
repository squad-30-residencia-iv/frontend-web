import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetAuthMockState } from '../mocks/handlers/auth'
import { resetCreatedCampaigns } from '../mocks/handlers/campaigns'
import { resetRegistryState } from '../mocks/handlers/registry'
import { resetSatelliteMockState } from '../mocks/handlers/satellite'
import { server } from '../mocks/server'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetAuthMockState()
  resetCreatedCampaigns()
  resetRegistryState()
  resetSatelliteMockState()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})
