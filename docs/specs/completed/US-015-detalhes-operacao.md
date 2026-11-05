# US-015 — Detalhes da operação de Auditoria

Continuar Auditoria em /auditoria/:operationId, substituindo a abertura do modal por navegação. Reutilizar repositório único, PageHeader, PortalLayout audit, componentes e exportador CSV. Adicionar justificativa ao contrato/mock central e representar o primeiro evento conforme protótipo: quantidade, término e canal. Demais eventos apresentam apenas suas alterações e justificativas aplicáveis (bloqueio/alertas/falha).

Preservar filtros editados/aplicados e página via estado do histórico, sem duplicar dados ou criar API. Retorno e breadcrumb voltam à listagem; acesso direto sem contexto volta ao estado inicial. Exportação usa apenas o evento carregado. Estados loading/error/retry/not-found e proteção contra carregamentos antigos.

- [x] Tipos/repositório/exportação e estado de navegação
- [x] Página dinâmica, tabela de alterações, justificativa e retorno
- [x] Testes de rota, dados, exportação, retorno e estados
- [x] Verify/build, relatório e PROJECT_STATE

Validação final: npm run verify aprovado (165 testes em 14 arquivos), npm run build aprovado com avisos existentes de bundle/Zod. Dezesseis testes de detalhes e dois de navegação substituem os quatro casos do modal anterior. Um teste preexistente de descarte de campanha excedeu 5s na primeira suíte; repetição completa aprovada sem alterar esse teste. Sem revisão visual manual em navegador e sem commit/push.

