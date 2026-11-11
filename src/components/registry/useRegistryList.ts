import { useEffect, useRef, useState } from 'react'
import type { RegistryRow } from '../../types/registry'

export type RegistryListPhase = 'idle' | 'loading' | 'ready' | 'error'

export interface RegistryListState {
  phase: RegistryListPhase
  rows: RegistryRow[]
  /** Recarregando depois de uma gravação, com as linhas anteriores na tela. */
  isRefreshing: boolean
  errorMessage: string
  retry: () => void
}

function sortRows(rows: RegistryRow[]) {
  return [...rows].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'pt-BR'))
}

/**
 * Carrega uma coluna. Sem `parentKey`, a coluna espera a escolha do pai.
 * Trocar o pai mostra o carregamento; mudar `refreshKey` recarrega mantendo as linhas, para não perder o foco.
 */
export function useRegistryList(parentKey: string | null, load: () => Promise<RegistryRow[]>, refreshKey: number): RegistryListState {
  const [phase, setPhase] = useState<RegistryListPhase>(parentKey ? 'loading' : 'idle')
  const [rows, setRows] = useState<RegistryRow[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const loadRef = useRef(load)
  const loadedKey = useRef<string | null>(null)

  // Declarado antes do carregamento: os efeitos rodam em ordem e a busca usa sempre o load atual.
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (!parentKey) {
      loadedKey.current = null
      setRows([])
      setIsRefreshing(false)
      setPhase('idle')
      return
    }

    let cancelled = false
    const sameParent = loadedKey.current === parentKey
    if (sameParent) {
      setIsRefreshing(true)
    } else {
      setRows([])
      setPhase('loading')
    }

    loadRef.current()
      .then(items => {
        if (cancelled) return
        loadedKey.current = parentKey
        setRows(sortRows(items))
        setPhase('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        loadedKey.current = null
        setErrorMessage(error instanceof Error ? error.message : '')
        setPhase('error')
      })
      .finally(() => {
        if (!cancelled) setIsRefreshing(false)
      })

    return () => {
      cancelled = true
    }
  }, [parentKey, refreshKey, attempt])

  return { phase, rows, isRefreshing, errorMessage, retry: () => setAttempt(current => current + 1) }
}
