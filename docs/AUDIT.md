# Auditoria — US-014

A rota `/auditoria` substitui o placeholder, com PortalLayout audit e PageHeader contendo breadcrumb Portal > Auditoria, título e ação Exportar histórico. Reutiliza Input, Select, Button, Loading, EmptyState, Modal, Dropdown HeroUI, Lucide e tokens do tema. Nenhuma dependência ou endpoint novo.

## Dados e regras
- `data/auditRepository.ts` centraliza 80 registros tipados, carregador local Promise injetável, rótulos, filtragem, formatação e resumo. Primeiros três registros reproduzem campanhas, responsáveis, operações, perfis, status e horários da referência; demais dados são demonstrativos.
- Cards contam o conjunto carregado completo: 80 operações, oito campanhas distintas, três usuários e 45 operações críticas. Críticas correspondem a bloqueio, alerta prioritário e falha técnica.
- O protótipo apresenta números conflitantes (24 total vs. 45 críticas, dois usuários vs. três nomes, três linhas vs. sete de 80 no rodapé). A implementação mantém o visual e usa contagens coerentes com os mocks. Paginação de sete registros, 12 páginas e três itens na última. Rodapé conta registros de auditoria.
- Busca normalizada por campanha, código AUD ou responsável. Operação, responsável e últimos 30/90 dias combináveis. Aplicação por Filtrar/Enter; limpeza restaura campos, resultados e página 1.
- Períodos incluem os limites de datas locais e excluem eventos futuros. Tabela usa dd/MM às HH:mm e detalhes/CSV incluem ano; apresentação no fuso America/Sao_Paulo. Status dos mocks são snapshots explícitos.
- Cards globais não mudam com filtros. A tabela tem rolagem horizontal focável; cards tornam-se duas colunas em telas pequenas.

## Detalhes operacionais
Menu de ações navega para /auditoria/:operationId (US-015), substituindo o modal inicial. Metadados de data/hora, usuário, perfil, status, operação e campanha sempre presentes. Alterações antes/depois, motivo de bloqueio, alertas e falha técnica aparecem apenas quando aplicáveis ao registro. Nenhum bloco adicional foi inserido na página principal.

## CSV
Exporta todos os registros dos filtros aplicados, incluindo páginas não visíveis. Edições pendentes dos campos não alteram a exportação. Cabeçalhos em português, UTF-8 com BOM, separador ponto e vírgula, escape de aspas/quebras e neutralização de fórmulas. Inclui informações operacionais dos detalhes. Download via Blob/object URL temporário, sem servidor. Ação desabilitada em loading, erro e zero resultados; falha de exportação mantém filtros e mostra feedback compartilhado.

## Estados e testes
Loading, success, vazio e error/retry seguem o padrão da Home. Efeitos descartados não atualizam componente desmontado. Testes de UI cobrem a rota, sidebar, cards, busca/filtros, detalhes por teclado, paginação, exportação e estados. Testes do repositório/CSV verificam contagens, datas, formatação, escaping e download.

## Arquivos
- `src/types/audit.ts`
- `src/data/auditRepository.ts`
- `src/data/auditExport.ts`
- `src/data/auditRepository.test.ts`
- `src/components/audit/AuditFilters.tsx`
- `src/components/audit/AuditTable.tsx`
- `src/pages/AuditOperationDetailsPage.tsx` e CSS (US-015; substitui o modal inicial)
- `src/pages/AuditPage.tsx`, CSS e testes
- `src/App.tsx`
- Testes de Home e PageHeader atualizados à substituição do placeholder
- Spec US-014 e PROJECT_STATE.md

Sem commit/push. Revisão visual manual em navegador não realizada nesta sessão.

## Validação final
- npm run verify: aprovado, 151 testes em 12 arquivos; 20 novos de auditoria (14 UI e seis de repositório/CSV).
- npm run build: aprovado. Avisos existentes sobre tamanho do bundle e comentários da dependência Zod, sem erro.
- git diff --check: sem erros de whitespace.

A continuação de detalhes está documentada em docs/AUDIT_OPERATION_DETAILS.md. O CSV agora também inclui Justificativa; a listagem mantém exportação de todos os resultados aplicados.
