import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetAuthMockState } from '../mocks/handlers/auth'
import { server } from '../mocks/server'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetAuthMockState()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})
