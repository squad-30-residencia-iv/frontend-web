import { act, waitFor } from '@testing-library/react'
import { toast } from '@heroui/react'
import { expect } from 'vitest'

// A fila do Toast é global. clear() só remove o nó depois da animação de saída.
export async function clearToasts() {
  act(() => toast.clear())
  await waitFor(() => {
    expect(toast.getQueue().visibleToasts).toHaveLength(0)
    expect(document.body.querySelector('.toast__title')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}
