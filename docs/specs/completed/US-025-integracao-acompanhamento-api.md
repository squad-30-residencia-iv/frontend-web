# Especificação Técnica: US-025 — Integração das telas de acompanhamento

> Status: Completed  
> História de Usuário Relacionada: EP-03 / backend GH-050  
> Responsável: Danilo Araujo  
> Data: 2026-11-16  
> Branch: `feat/integracao-acompanhamento-api`

---

## 1. Contexto

Com `networkId` na sessão, o portal deixa de usar mocks locais para:

- `/vouchers` e `/vouchers/:id/historico` → `GET /api/v1/vouchers`
- Detalhe Guid → `redeemedVouchers` / `expiredVouchers` + lista via vouchers filtrados
- `/relatorios` → `GET /api/v1/reports/catalog` e `/overview`
- `/auditoria` e detalhe → `GET /api/v1/audit-entries`

Sem rede (admin ou testes isolados), mantém `src/data/*`.

## 2. Checklist

- [x] `services/vouchers.ts`, `reports.ts`, `audit.ts`
- [x] Páginas ligadas à sessão + MSW `portalReads`
- [x] Contadores no `toCampaignDetails` / `fetchCampaignDetails`
- [x] `npm run verify` (370 testes)

## 3. Fora de escopo

PDF, ticket médio real, operações fictícias do mock de auditoria (`priority-alert`).
