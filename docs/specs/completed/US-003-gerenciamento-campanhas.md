# US-003 — Gerenciamento de Campanhas

Data: 2026-10-13. Status: Completed.
Escopo aprovado: solicitação e referência anexadas pelo usuário na branch feat/02-criacao_campanhas.

## Contratos e decisões
Campanha: id, nome, início/fim ISO, escopo, vouchers, utilização e status tipado.
React/TypeScript estrito, CSS semântico adjacente, tokens existentes, componentes ui e Lucide. Sem roteador: /campanhas; login preservado em /. Sem backend ou formulário.
Sete campanhas da referência e registros demonstrativos identificados até 80 para paginação real. Período relativo à data fixa do conjunto (30/11/2024), explicitada no filtro. Indicadores são resumo mockado independente da busca.
Menu fechado na referência: abrir aviso de opções ainda não definidas, sem inventar operações críticas. Aprovar exige confirmação existente e produz feedback local.

## Verificação
- [x] Layout desktop/responsivo, busca, filtros, paginação, menu, aprovação, loading e vazio.
- [x] Testes de comportamento, build e verify.

