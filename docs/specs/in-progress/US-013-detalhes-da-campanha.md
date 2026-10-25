# Especificação Técnica: US-013 - Detalhes da campanha

> Status: In Progress
> História de Usuário Relacionada: [colar o link da issue]
> Responsável: [seu nome, de git config user.name]
> Data: 2026-10-24
> Branch: `feat/05_detalhes-da-compra`
> Protótipo: https://www.figma.com/proto/SW0o83ES2HBhP5nicacdpt/Portal-Campanhas--Copy-?node-id=2198-757

---

## 1. Contexto & Regras de Negócio

**História:** como usuário do portal, quero abrir os detalhes de uma campanha para acompanhar desempenho, vigência, validade dos vouchers, últimos vouchers emitidos e a configuração da campanha.

- Rota `/campanhas/:id`, aberta pelo nome da campanha na listagem. `/campanhas/nova` continua sendo a criação.
- Layout com `PortalLayout` (Campanhas ativo) e `PageHeader` (Portal > Campanhas > Detalhes da campanha).
- Blocos: resumo, aviso de demonstração, cinco indicadores, vigência, validade dos vouchers, últimos vouchers e informações detalhadas.
- Pausar/Retomar, Editar campanha e menus de ações só mostram o feedback "Ação em breve". "Ver todos os vouchers" leva a `/vouchers`.
- Estados: sucesso, sem vouchers (`EmptyState`) e campanha não encontrada (`EmptyState`). Carregando não se aplica: os dados são locais.
- Dados de demonstração: a campanha do protótipo abre em `/campanhas/material-novo-ideias-novas`; as da listagem derivam de `campaigns.ts` e `homeOverview.ts`. O cliente vem sempre mascarado.
- Fora de escopo: roteador, dependências, pausar/editar de verdade e a tela de vouchers.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

`src/types/campaignDetails.ts`: `CampaignDetails`, `CampaignVoucher`, `CampaignVoucherMetrics`, `CampaignInfoSection` e `VoucherStatus`.

---

## 3. Integração com a API Backend

Sem endpoint. A fronteira é `getCampaignDetails(id)` em `src/data/campaignDetails.ts`. Contrato a confirmar com o backend.

---

## 4. Checklist de Implementação

- [ ] 1. Tipos
- [ ] 2. Dados locais e cálculos
- [ ] 3. `CampaignDetailsPage` (TSX e CSS), rota em `App.tsx` e link na listagem
- [ ] 4. Testes da página e do link da listagem
- [ ] 5. `npm run verify` e `npm run build` aprovados
- [ ] 6. `PROJECT_STATE.md` atualizado

---

## 5. Casos de Teste Essenciais

- [ ] Renderiza todos os blocos da campanha de referência.
- [ ] Campanha agendada, encerrada e pausada mostram textos e ações corretos.
- [ ] Campanha inexistente e endereço malformado mostram "Campanha não encontrada".
- [ ] Nome da campanha na listagem abre `/campanhas/:id`.