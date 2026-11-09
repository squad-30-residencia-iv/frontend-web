import type { RegistryEntity, RegistryFormValues, StoreChannel } from '../../types/registry'

interface RegistryCopy {
  /** Nome em minúsculas, para frases ("rede", "produto"). */
  noun: string
  /** Título da coluna. */
  plural: string
  feminine: boolean
  /** Aviso da confirmação de inativar. */
  deactivateWarning: string
}

export const registryCopy: Record<RegistryEntity, RegistryCopy> = {
  network: {
    noun: 'rede',
    plural: 'Redes',
    feminine: true,
    deactivateWarning: 'Inativar a rede inativa as regiões e lojas dela. Depois, reativar a rede não reativa regiões e lojas: cada uma volta pelo próprio botão.',
  },
  region: {
    noun: 'região',
    plural: 'Regiões',
    feminine: true,
    deactivateWarning: 'Inativar a região inativa as lojas dela. Depois, reativar a região não reativa as lojas: cada uma volta pelo próprio botão.',
  },
  store: {
    noun: 'loja',
    plural: 'Lojas',
    feminine: true,
    deactivateWarning: 'A loja fica inativa e sai dos seletores de campanha. Você pode reativá-la depois.',
  },
  category: {
    noun: 'categoria',
    plural: 'Categorias',
    feminine: true,
    deactivateWarning: 'Inativar a categoria inativa os produtos dela. Depois, reativar a categoria não reativa os produtos: cada um volta pelo próprio botão.',
  },
  product: {
    noun: 'produto',
    plural: 'Produtos',
    feminine: false,
    deactivateWarning: 'O produto fica inativo e sai dos seletores de campanha. Você pode reativá-lo depois.',
  },
}

export const channelLabels: Record<StoreChannel, string> = {
  Physical: 'Físico',
  Virtual: 'Virtual',
}

export const defaultTimeZone = 'America/Sao_Paulo'

export const emptyFormValues: RegistryFormValues = { name: '', code: '', timeZone: '', channels: [] }

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** "Nova rede", "Novo produto". */
export function newLabel(entity: RegistryEntity) {
  const { noun, feminine } = registryCopy[entity]
  return `${feminine ? 'Nova' : 'Novo'} ${noun}`
}

/** "Ativa"/"Inativa" ou "Ativo"/"Inativo", conforme o gênero. */
export function statusLabel(entity: RegistryEntity, isActive: boolean) {
  const ending = registryCopy[entity].feminine ? 'a' : 'o'
  return `${isActive ? 'Ativ' : 'Inativ'}${ending}`
}

export type RegistryOutcome = 'created' | 'updated' | 'deactivated' | 'reactivated'

const outcomeVerbs: Record<RegistryOutcome, string> = {
  created: 'criad',
  updated: 'atualizad',
  deactivated: 'inativad',
  reactivated: 'reativad',
}

/** "Rede criada.", "Produto inativado." */
export function outcomeMessage(entity: RegistryEntity, outcome: RegistryOutcome) {
  const { noun, feminine } = registryCopy[entity]
  return `${capitalize(noun)} ${outcomeVerbs[outcome]}${feminine ? 'a' : 'o'}.`
}

/** "2 ativas · 1 inativa". */
export function countSummary(entity: RegistryEntity, active: number, inactive: number) {
  const ending = registryCopy[entity].feminine ? 'a' : 'o'
  const part = (count: number, stem: string) => `${count} ${stem}${ending}${count === 1 ? '' : 's'}`
  return inactive > 0 ? `${part(active, 'ativ')} · ${part(inactive, 'inativ')}` : part(active, 'ativ')
}

export function channelsText(channels: readonly StoreChannel[]) {
  return channels.map(channel => channelLabels[channel]).join(' e ')
}
