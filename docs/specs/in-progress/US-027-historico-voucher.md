# Especificação Técnica: US-027 - Histórico do voucher

> Status: In Progress
> História de Usuário Relacionada: https://github.com/squad-30-residencia-iv/frontend-web/issues/27
> Responsável: [seu nome, de git config user.name]
> Data: 2026-11-09
> Branch: `feat/10_historico-voucher`

---

## 1. Contexto & Regras de Negócio

**História:** como usuário do portal, quero ver o histórico de um voucher (emissão, validação, resgate, expiração e cancelamento) para rastrear o ciclo de vida dele antes da API real.

- Rota `/vouchers/:id/historico` (o `id` é o identificador interno do voucher), dentro do `PortalLayout` com Vouchers ativo e de `ProtectedRoute`. Substitui o destino provisório `VoucherHistoryPending`.
- Entrada pela Consulta de vouchers: o item "Ver histórico" do `VoucherActionsMenu` já navega para a rota.
- `PageHeader` com subtítulo e caminho Portal > Vouchers > Histórico (o item Vouchers volta para a consulta).
- Blocos: Resumo do voucher (código, campanha de origem, cliente já mascarado, emissão, validade, usos, status e benefício), Escopo e Regras de utilização e Linha do tempo das movimentações (movimentação, data/hora, origem, canal/local e resultado), do evento mais recente ao mais antigo.
- Botão de voltar no rodapé da linha do tempo leva à consulta (`/vouchers`).
- Estados: carregando (`Loading`), sucesso, voucher não encontrado (`EmptyState`) e erro com recuperação ("Tentar novamente" e "Voltar para vouchers").
- Dados mockados em `src/data/voucherHistory.ts`, a partir do `Voucher` e da lista da Consulta. O voucher do protótipo (`VCH-8F2A91`) usa os valores ilustrativos do Figma; os demais têm histórico derivado do status e das datas.
- Fora de escopo: roteador, novas dependências, ações sobre o voucher (cancelar, resgatar) e alterações na Consulta além de remover o destino provisório.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

`src/types/voucherHistory.ts`: `VoucherHistory` (`voucher`, `benefit`, `scope`, `events`), `VoucherEvent`, `VoucherScopeItem` e `VoucherEventType`. O voucher reutiliza `Voucher` de `src/types/voucher.ts`.

---

## 3. Integração com a API Backend

Sem endpoint. A fronteira é `loadVoucherHistory(id)` em `src/data/voucherHistory.ts`, injetável na página pela prop `loadHistory`. Contrato a confirmar com o backend.

---

## 4. Checklist de Implementação

- [ ] 1. Tipos
- [ ] 2. Dados mockados e ordenação dos eventos
- [ ] 3. `VoucherHistoryPage` (TSX e CSS), rota em `App.tsx` e remoção do destino provisório
- [ ] 4. Testes da página e ajuste do teste da Consulta
- [ ] 5. `npm run verify` e `npm run build` aprovados
- [ ] 6. Doc da tela e `PROJECT_STATE.md` atualizados

---

## 5. Casos de Teste Essenciais

- [ ] Renderiza resumo, escopo e linha do tempo do voucher de referência.
- [ ] Histórico coerente com o status (utilizado, expirado, cancelado e disponível).
- [ ] Eventos do mais recente ao mais antigo.
- [ ] Voltar e caminho levam a `/vouchers`.
- [ ] Voucher inexistente, carregamento e erro com "Tentar novamente".
- [ ] "Ver histórico" na Consulta abre a tela e `/vouchers/:id/historico` resolve no App.