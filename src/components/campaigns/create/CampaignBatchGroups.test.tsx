import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { CampaignBatchGroups } from './CampaignBatchGroups'
import type { CampaignBatch } from '../../../data/campaignBatch'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
})
afterAll(() => vi.unstubAllGlobals())

function Harness() {
  const [value, setValue] = useState<CampaignBatch | null>(null)
  return <CampaignBatchGroups value={value} onChange={setValue} />
}

describe('Grupos destinatários do lote', () => {
  it('seleciona vários grupos e permite remover um ou limpar todos', async () => {
    render(<Harness />)
    const user = userEvent.setup()
    for (const name of ['Grupo demonstrativo A', 'Grupo demonstrativo B']) {
      await user.click(screen.getByRole('button', { name: /Grupos de clientes/ }))
      await user.click(await screen.findByRole('option', { name: new RegExp(name) }))
      await user.keyboard('{Escape}')
    }
    const list = screen.getByRole('list', { name: 'Grupos selecionados' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('2 grupos selecionados · 4 clientes únicos')
    await user.click(screen.getByRole('button', { name: 'Remover Grupo demonstrativo A' }))
    expect(within(list).queryByText('Grupo demonstrativo A')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('3 clientes únicos')
    await user.click(screen.getByRole('button', { name: 'Limpar grupos' }))
    expect(screen.queryByRole('list', { name: 'Grupos selecionados' })).not.toBeInTheDocument()
  })

  it('mostra catálogo vazio e erro de validação', () => {
    render(<CampaignBatchGroups value={null} onChange={() => {}} groups={[]} error="Selecione um grupo." />)
    expect(screen.getByText('Nenhum grupo disponível.')).toBeVisible()
    expect(screen.getByText('Selecione um grupo.')).toBeVisible()
  })
})
