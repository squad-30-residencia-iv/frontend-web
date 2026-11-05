# US-014 — Auditoria

Implementar /auditoria em PortalLayout audit, PageHeader com Exportar histórico, quatro cards, filtros aplicados por botão/Enter, tabela responsiva de sete registros/página, detalhes em modal compartilhado e CSV de todos os resultados filtrados. Preservar componentes/rotas existentes e tipagem estrita; repositório local injetável sem endpoints.

A imagem apresenta total 24, críticas 45, responsáveis 2 e três nomes, com rodapé de 80 registros e apenas três linhas. Usar 80 registros (primeiros três da referência, demais demonstrativos), oito campanhas, três responsáveis e 45 operações críticas; cards calculados sobre o conjunto carregado. Rodapé conta registros, não campanhas. Operações críticas: bloqueio, alerta prioritário e falha técnica.

- [x] Tipos, repositório local e exportação CSV
- [x] Página, filtros, tabela e detalhes em modal acessível
- [x] Estados, retry, paginação e navegação
- [x] Testes, verify, build e documentação

Validação concluída: npm run verify aprovado com 151 testes em 12 arquivos; npm run build aprovado com avisos existentes de bundle/Zod. Vinte testes novos de Auditoria/repositório/CSV. Sem revisão visual manual em navegador. Sem commit/push.

