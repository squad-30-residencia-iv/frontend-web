# Especificacao Tecnica: US-018 - Campanhas da rede na Home e na listagem

> Status: Completed
> Historia de Usuario Relacionada: US-01.9 (consultar campanhas)
> Responsavel: Danilo Araujo
> Data: 2026-11-08

---

## 1. Contexto & Regras de Negocio

- A Home e o gerenciamento deixam de usar as campanhas locais e passam a ler `GET /api/v1/campaigns?networkId=`.
- `networkId` vem da sessão. Sem rede (administrador), a tela mostra a lista vazia e não chama a API.
- Lista vazia no banco mostra o estado vazio. As campanhas de demonstração (Black Friday e as demais) não entram nessa tela.
- O cartão usa nome, vigência e status. A quantidade é `totalVoucherLimit` (zero quando nulo). A utilização fica em zero. O benefício da Home sai do primeiro item, quando existir.
- O escopo exibido na tabela é "Rede". Ainda não há escopo por loja.
- Submeter, aprovar, pausar e encerrar saem da listagem. Essas ações não têm rota.
- Carregando e erro de rede continuam visíveis. Erro oferece tentar de novo na Home.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export interface ApiCampaign {
  id: string
  name: string
  description: string | null
  startsAt: string
  endsAt: string
  status: string
  totalVoucherLimit: number | null
  items: {
    benefitType: string
    benefitValue: number
    categoryId: string | null
  }[]
}
```

Status da API: `Draft`, `PendingApproval`, `Scheduled`, `Active`, `Paused`, `Ended`, `Cancelled`, `SoldOut`.

---

## 3. Integração com a API Backend

- Endpoint: `GET /api/v1/campaigns?networkId=`
- Cabeçalho: `Authorization` já anexado pelo cliente
- 200: lista, da mais recente para a mais antiga
- Sem `networkId` na sessão: nenhuma requisição
- Falha de rede: estado de erro na Home e no gerenciamento

---

## 4. Checklist de Implementação

- [x] 1. Tradução do corpo da API para os cartões
- [x] 2. Home lê a rede da sessão e mostra vazio sem campanha
- [x] 3. Gerenciamento lê a mesma lista e deixa de oferecer ações de status
- [x] 4. MSW responde o `GET` com poucas campanhas
- [x] 5. `npm run verify` e a Home no navegador com o mock desligado

---

## 5. Casos de Teste Essenciais

- [x] Analista com rede recebe as campanhas do `GET`.
- [x] Administrador vê a lista vazia sem chamar a API.
- [x] A listagem não mostra submeter, aprovar, pausar nem encerrar.
- [x] Benefício percentual do primeiro item aparece na Home.
