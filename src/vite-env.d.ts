/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' liga o MSW no desenvolvimento. Qualquer outro valor usa o backend real. */
  readonly VITE_USE_MOCK?: string
  /** Endereço do backend real. Vazio ou ausente = mesma origem. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}