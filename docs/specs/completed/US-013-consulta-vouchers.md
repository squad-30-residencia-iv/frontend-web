# US-013 — Consulta de Vouchers

Implementar /vouchers conforme imagem com PortalLayout, PageHeader (subtítulo opcional), cards, filtros aplicados por Filtrar, busca por código/cliente, tabela, badges, menu de histórico e paginação de sete itens. Mocks tipados separados do carregador local injetável; estados loading/error/success/empty e retry. Histórico apenas destino com aviso provisório, sem implementação da consulta de movimentações.

A referência combina cards somando 5.899 vouchers, total 120 e página 843: valores inconsistentes. Usar 5.899 registros demonstrativos para cards/paginação coerentes e preservar sete linhas iniciais da imagem. Períodos relativos à data atual local; status dos mocks são explícitos, não inferidos do relógio.

- [x] Tipos, mocks, carregamento e filtros
- [x] Componentes, rota e layout responsivo
- [x] Testes e build/verify

Validação: npm run verify aprovado com 117 testes em 9 arquivos. Build de produção aprovado; revisão visual manual em navegador não realizada. Sem commit/push.


## Ajuste 2026-10-26 — apresentação dos filtros
- Rótulos e valores alinhados, tipografia compacta uniforme, alturas/espaçamentos padronizados e estados de hover/foco.
- Indicador do Select em fluxo normal para evitar sobreposição ao texto; valores longos com reticências. Alteração restrita ao CSS da consulta.
