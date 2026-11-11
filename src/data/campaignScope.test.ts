import { describe, expect, it } from 'vitest'
import { storeScopeChannels, validateCampaignScope, type CampaignStore } from './campaignScope'

const stores: CampaignStore[] = [
  { id: 'loja-centro', code: '001', name: 'Loja Centro', channels: ['physical'] },
  { id: 'loja-online', code: '003', name: 'Loja Online', channels: ['virtual'] },
  { id: 'loja-demo', code: '009', name: 'Loja demonstrativa' },
]

describe('escopo por loja e canal (US-021)', () => {
  it('cada loja recebe os canais escolhidos que ela opera', () => {
    expect(storeScopeChannels(stores[0], ['physical', 'virtual'])).toEqual(['physical'])
    expect(storeScopeChannels(stores[1], ['physical'])).toEqual([])
    expect(storeScopeChannels(stores[2], ['virtual'])).toEqual(['virtual'])
  })

  it('acusa a loja que não opera nenhum dos canais escolhidos', () => {
    const errors = validateCampaignScope(
      { mode: 'stores', networkChannels: [], storeIds: ['loja-centro', 'loja-online'], storeChannels: ['physical'] },
      stores,
    )

    expect(errors.stores).toBe('A loja 003 — Loja Online não opera nenhum dos canais escolhidos.')
  })

  it('aceita lojas com canais diferentes quando cada uma opera algum escolhido', () => {
    const errors = validateCampaignScope(
      { mode: 'stores', networkChannels: [], storeIds: ['loja-centro', 'loja-online', 'loja-demo'], storeChannels: ['physical', 'virtual'] },
      stores,
    )

    expect(errors).toEqual({})
  })
})
