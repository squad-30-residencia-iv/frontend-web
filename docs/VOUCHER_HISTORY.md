# Histórico do voucher — entrega

Spec: `docs/specs/completed/US-027-historico-voucher.md`. Branch: `feat/10_historico-voucher`. Issue #27.

## O que a tela entrega
- Rota `/vouchers/:id/historico` (id interno do voucher) no `PortalLayout` com Vouchers ativo e dentro de `ProtectedRoute`, substituindo o destino provisório `VoucherHistoryPending`.
- Entrada pela Consulta: o item "Ver histórico" do `VoucherActionsMenu` abre a tela.
- `PageHeader` com subtítulo e caminho Portal > Vouchers > Histórico. Resumo do voucher, escopo e regras de utilização e linha do tempo das movimentações, do evento mais recente ao mais antigo.
- Botão de voltar no rodapé da linha do tempo e item "Vouchers" do caminho levam a `/vouchers`.
- Estados: carregando, sucesso, voucher não encontrado e erro com "Tentar novamente".

## Arquivos
Criados: `src/types/voucherHistory.ts`, `src/data/voucherHistory.ts`, `src/pages/VoucherHistoryPage.tsx`, `.css` e `.test.tsx`.
Modificados: `src/App.tsx` (rota), `src/pages/VoucherLookupPage.tsx` (remoção do destino provisório) e `src/pages/VoucherLookupPage.test.tsx` (expectativa do destino do histórico).

## Dados
- Reaproveita o `Voucher` e a lista de `data/vouchers.ts`. `loadVoucherHistory(id)` é o ponto único de troca por uma API; a página aceita `loadHistory` para injetá-lo (usado nos testes de erro e carregamento).
- `VCH-8F2A91` (`voucher-1`) usa os valores ilustrativos do protótipo, que se contradizem entre si (emissão no resumo diferente do evento de emissão, e "Resgate" em voucher disponível) e foram mantidos. Os demais vouchers têm histórico demonstrativo derivado do status e das datas; o benefício aparece como "Não informado" porque o `Voucher` não tem esse campo.
- O cliente vem sempre mascarado (`clientIdentification`).

## Limites
- Cancelar ou resgatar voucher não fazem parte desta entrega. Contrato de API a confirmar com o backend.