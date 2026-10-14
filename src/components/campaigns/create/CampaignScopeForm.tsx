import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { EmptyState } from '../../ui/EmptyState'
import type { CampaignChannel, CampaignDraft } from '../../../types/campaign'
import { campaignStores, type CampaignScopeErrors } from '../../../data/campaignScope'
import './CampaignScopeForm.css'

type Scope = CampaignDraft['scope']

interface CampaignScopeFormProps {
  value: Scope
  errors: CampaignScopeErrors
  onChange: (value: Scope) => void
}

interface ChannelOptionsProps {
  label: string
  name: 'networkChannels' | 'storeChannels'
  value: CampaignChannel[]
  errorMessage?: string
  onChange: (value: CampaignChannel[]) => void
}

const channelOptions: readonly { value: CampaignChannel; label: string }[] = [
  { value: 'physical', label: 'Físico' },
  { value: 'virtual', label: 'Virtual' },
]

function ChannelOptions({ label, name, value, errorMessage, onChange }: ChannelOptionsProps) {
  const errorId = `${name}-error`

  function toggleChannel(channel: CampaignChannel) {
    const next = value.includes(channel)
      ? value.filter(item => item !== channel)
      : [...value, channel]

    onChange(next)
  }

  return (
    <fieldset
      className="campaign-scope-channels"
      aria-label={label}
      aria-invalid={Boolean(errorMessage)}
      aria-describedby={errorMessage ? errorId : undefined}
    >
      <legend>Canais</legend>
      <div className="campaign-scope-channel-options">
        {channelOptions.map(channel => (
          <label className="campaign-scope-option" key={channel.value}>
            <input
              type="checkbox"
              name={name}
              value={channel.value}
              checked={value.includes(channel.value)}
              onChange={() => toggleChannel(channel.value)}
            />
            {channel.label}
          </label>
        ))}
      </div>
      {errorMessage && <p id={errorId} className="campaign-scope-error" role="alert">{errorMessage}</p>}
    </fieldset>
  )
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function CampaignScopeForm({ value, errors, onChange }: CampaignScopeFormProps) {
  const [search, setSearch] = useState('')
  const query = normalizeSearch(search)
  const matchingStores = campaignStores.filter(store => {
    const matchesQuery = normalizeSearch(`${store.code} ${store.name}`).includes(query)
    return matchesQuery && !value.storeIds.includes(store.id)
  })

  function addStore(id: string) {
    if (value.storeIds.includes(id)) return

    onChange({ ...value, mode: 'stores', storeIds: [...value.storeIds, id] })
    setSearch('')
  }

  function removeStore(id: string) {
    onChange({ ...value, storeIds: value.storeIds.filter(storeId => storeId !== id) })
  }

  return (
    <section className="create-campaign-information campaign-scope" aria-labelledby="campaign-scope-title">
      <h2 id="campaign-scope-title" tabIndex={-1}>Escopo Organizacional</h2>
      <p className="campaign-scope-description">Selecione a loja ou grupos de lojas relacionada a campanha:</p>

      <section className="campaign-scope-panel" aria-label="Abrangência de toda a rede">
        <label className="campaign-scope-network">
          <input
            type="checkbox"
            name="scopeMode"
            checked={value.mode === 'network'}
            onChange={event => onChange({ ...value, mode: event.target.checked ? 'network' : 'stores' })}
          />
          Toda a rede
        </label>
        <ChannelOptions
          label="Canais de toda a rede"
          name="networkChannels"
          value={value.networkChannels}
          errorMessage={errors.networkChannels}
          onChange={networkChannels => onChange({ ...value, networkChannels })}
        />
      </section>

      <section className="campaign-scope-panel" aria-labelledby="campaign-specific-stores-title">
        <h3 id="campaign-specific-stores-title">Lojas específicas</h3>
        <p>Busque e adicione lojas específicas:</p>
        <Input
          className="campaign-scope-search"
          label="Buscar lojas"
          name="stores"
          icon={Search}
          placeholder="Buscar por código ou cliente..."
          value={search}
          onChange={setSearch}
          validationBehavior="aria"
          errorMessage={errors.stores}
          inputProps={{ autoComplete: 'off' }}
        />

        {query && (
          matchingStores.length > 0 ? (
            <ul className="campaign-scope-results" aria-label="Lojas encontradas">
              {matchingStores.map(store => (
                <li key={store.id}>
                  <Button type="button" variant="ghost" onPress={() => addStore(store.id)}>
                    Adicionar loja {store.code} — {store.name}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma loja encontrada" description="Tente outro código ou nome de loja." />
          )
        )}

        {value.storeIds.length > 0 && (
          <ul className="campaign-scope-selected" aria-label="Lojas selecionadas">
            {value.storeIds.map(id => {
              const store = campaignStores.find(item => item.id === id)
              const label = store ? `${store.code} — ${store.name}` : 'Loja indisponível'

              return (
                <li key={id}>
                  <span>{label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    startIcon={X}
                    aria-label={`Remover loja ${label}`}
                    onPress={() => removeStore(id)}
                  />
                </li>
              )
            })}
          </ul>
        )}

        <ChannelOptions
          label="Canais das lojas específicas"
          name="storeChannels"
          value={value.storeChannels}
          errorMessage={errors.storeChannels}
          onChange={storeChannels => onChange({ ...value, storeChannels })}
        />
      </section>
    </section>
  )
}
