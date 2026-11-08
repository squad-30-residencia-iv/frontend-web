# Especificacao Tecnica: US-020 - Submeter e aprovar no detalhe

> Status: Completed
> Historia de Usuario Relacionada: US-01.6 e US-01.11
> Responsavel: Danilo Araujo
> Data: 2026-11-08

---

## 1. Contexto & Regras de Negocio

- No detalhe de um Guid, o papel vem da sessão. `analista` vira `analyst` e `gestor` vira `manager`. Sem sessão, o detalhe local continua com o papel padrão dos testes.
- Rascunho e analista: botão Submeter. Pendente e gestor: Aprovar e Reprovar. O motivo da reprovação continua opcional.
- Pausar e Encerrar não aparecem numa campanha da API. Ids locais continuam no repositório do navegador.
- Depois da resposta, a tela mostra o status devolvido. Reprovação mostra o motivo. `422` mostra `detail`.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export type CampaignDecision = 'submit' | 'approve' | 'reject'
```

`CampaignResponse.rejectionReason` entra no detalhe. Aprovar uma campanha com início futuro mostra Agendada.

---

## 3. Integração com a API Backend

- `POST /api/v1/campaigns/{id}/submit`
- `POST /api/v1/campaigns/{id}/approve`
- `POST /api/v1/campaigns/{id}/reject` com `{ reason }` ou `null`
- 200: o mesmo corpo do detalhe, com o novo `status`
- 403: a tela mostra a mensagem genérica de falha da ação
- 422: a tela mostra `detail`

---

## 4. Checklist de Implementação

- [x] 1. Traduzir o papel da sessão e chamar as três rotas
- [x] 2. Mostrar só Submeter, Aprovar e Reprovar no Guid, conforme o papel e o status
- [x] 3. Atualizar o detalhe com a resposta e o motivo da reprovação
- [x] 4. MSW e testes do analista e do gestor
- [x] 5. `npm run verify` e a sequência no navegador

---

## 5. Casos de Teste Essenciais

- [x] Analista submete e o detalhe fica pendente, sem o botão.
- [x] Gestor não vê Submeter no rascunho.
- [x] Gestor aprova uma campanha com início futuro e o detalhe fica agendado.
- [x] Gestor reprova e o motivo aparece.
- [x] Campanha local continua com a matriz antiga, inclusive Pausar e Encerrar.
