# Especificação Técnica: US-021 - Escopo e ciclo da campanha

> Status: Completed
> História de Usuário Relacionada: US-02.3, US-01.7 (rascunho), US-01.10 e D6; issue frontend-web#38 (API em backend-api#46)
> Responsável: Gabriel Torres
> Data: 2026-11-09

---

## 1. Contexto & Regras de Negócio

- O assistente passa a gravar onde a campanha vale. "Toda a rede" envia um local sem região nem loja, com os canais dela. "Lojas específicas" envia cada loja escolhida com os canais.
- O canal é atributo da loja (PR-11): a API recusa canal que a loja não opera. Como a tela escolhe um conjunto de canais para todas as lojas, cada loja vai só com os canais que opera dentre os escolhidos. A tela acusa a loja que não opera nenhum deles.
- O rascunho gravado pode ser reaberto. No detalhe de um rascunho da API, analista e gestor veem **Editar rascunho**, que abre o assistente em `/campanhas/{id}/editar` preenchido com a campanha. Salvar repete os `PUT`, com nome e vigência no `PUT /campaigns/{id}`, e volta ao detalhe.
- Campanha agendada não se edita: a mecânica congela na aprovação (D6). Fora de rascunho, o detalhe mostra **Duplicar**, que cria outra campanha em rascunho (nome e vigência editáveis) e abre a edição dela. A rota de edição de uma campanha fora de rascunho explica a regra e não mostra o formulário.
- O motivo da reprovação continua opcional (D6).
- O detalhe e a listagem mostram o escopo gravado (lojas, região ou rede, e canais).

### 1.1 Decisões

| # | Ponto | Decisão |
|---|---|---|
| D-1 | Lojas com canais diferentes. | Interseção por loja; erro só para a loja sem nenhum dos canais escolhidos. |
| D-2 | O que a tela não representa (região no escopo, condição de categoria, produto ou quantidade, validade por data fixa ou em horas, teto, benefícios diferentes por alvo). | A edição avisa o que será substituído ao salvar. Campanhas criadas pelo portal não caem nesse caso. |
| D-3 | "Salvar rascunho" local na edição. | Não aparece: a edição grava direto na API. |
| D-4 | Descrição. | A tela não edita a descrição; a edição reenvia a gravada. |

---

## 2. Contratos de Dados

```typescript
export interface CampaignStore { id: string; code: string; name: string; channels?: CampaignChannel[] }

export interface ApiCampaignScope {
  regionId: string | null
  establishmentId: string | null
  name: string | null
  code: string | null
  channels: string[]
}

export interface EditableCampaign {
  id: string
  status: CampaignStatus
  description: string | null
  draft: CampaignDraft
  notices: string[]
}
```

---

## 3. Integração com a API Backend

- `PUT /api/v1/campaigns/{id}/scopes` `{ scopes: [{ regionId, establishmentId, channels }] }`
- `PUT /api/v1/campaigns/{id}` `{ name, description, startsAt, endsAt }` ao salvar uma campanha que já existe
- `GET /api/v1/campaigns/{id}` para reabrir (lê `scopes`)
- `POST /api/v1/campaigns/{id}/duplicate` `{ name, startsAt, endsAt }` → 201 com a cópia
- 422: a tela mostra `detail` (ex.: "A loja 001 não opera o canal virtual.")

---

## 4. Checklist de Implementação

- [x] 1. Tipos, canais das lojas e validação por loja
- [x] 2. Corpo do escopo, `PUT` de nome e vigência e leitura do escopo
- [x] 3. Edição do rascunho (rota, carga e gravação) e bloqueio fora de rascunho
- [x] 4. Editar rascunho e Duplicar no detalhe; escopo no detalhe e na listagem
- [x] 5. MSW, testes e `npm run verify`

---

## 5. Casos de Teste Essenciais

- [x] O assistente envia a rede com os canais, ou cada loja com os canais que ela opera.
- [x] Loja que não opera nenhum canal escolhido bloqueia a etapa com a mensagem.
- [x] O rascunho da API reabre preenchido e salvar chama `PUT /campaigns/{id}` sem novo `POST`.
- [x] A edição de campanha agendada mostra a regra (D6) e não o formulário.
- [x] O detalhe mostra Editar rascunho no rascunho e Duplicar fora dele; duplicar abre a edição da cópia.
- [x] O detalhe e a listagem mostram o escopo gravado.
