import axios from 'axios'
import { clearSession, getValidToken } from './tokenStorage'

export const api = axios.create({
  // Vazio = mesma origem. Com VITE_USE_MOCK=false, aponte para o backend real.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
})

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

/** O AuthProvider registra aqui o que fazer quando uma rota privada devolver 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

function isLoginRequest(url?: string) {
  return Boolean(url?.includes('/auth/login'))
}

// Antes de cada requisição: anexa "Authorization: Bearer <token>" quando há token válido.
api.interceptors.request.use((config) => {
  const token = getValidToken()
  if (token && !isLoginRequest(config.url) && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Depois de cada resposta: 401 em rota privada = sessão inválida ou expirada.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isLoginRequest(error.config?.url)) {
      clearSession()
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)