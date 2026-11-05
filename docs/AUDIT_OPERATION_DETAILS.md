# Detalhes da operação — US-015

`/auditoria/:operationId` carrega o evento pelo ID no mesmo repositório local da listagem. O menu Ver detalhes agora navega para esta rota, substituindo o modal anterior. IDs codificados são tratados pelo resolvedor existente do App; ID ausente resulta em estado não encontrado, sem cair no login.

## Interface
PortalLayout mantém Auditoria ativa. PageHeader mostra Portal > Auditoria > Detalhes da operação e Exportar evento. Três seções seguem a referência: informações da operação com badge, tabela de alterações do evento selecionado e justificativa. Tabelas têm rolagem horizontal focável e texto longo quebra dentro das células. Não há cópia independente de mocks.

O primeiro evento passou a conter, no repositório central, as três alterações do protótipo: 5.000 para 8.000 vouchers, término de 20/11 para 30/11/2024 e canal físico para físico e virtual. Justificativa: A quantidade foi ampliada devido à alta adesão. Eventos sem alterações exibem mensagem explícita; justificativas combinam texto, motivo de bloqueio, alertas prioritários e falha técnica somente quando existentes. Na ausência de qualquer motivo, informa-se que não há justificativa registrada.

## Navegação e integração
- `loadAuditRecord(id)` usa a mesma fonte de `loadAuditRecords()`; não cria endpoints nem uma nova coleção.
- O estado de histórico guarda somente campos de filtros, filtros aplicados e página, validado em runtime com Zod. O repositório continua sendo a fonte dos registros.
- Botão de retorno, breadcrumb e Voltar nativo restauram o contexto da listagem. Acesso direto sem contexto usa a lista inicial. Estado inválido é ignorado com segurança.
- `navigate` recebeu um segundo argumento opcional para estado do histórico; comportamento padrão das rotas existentes permanece igual. Cliques modificados no breadcrumb mantêm a navegação nativa.
- Loading, erro com retry, não encontrado e sucesso; exportar só fica habilitado no sucesso. Respostas descartadas após desmontagem/troca de ID não sobrescrevem o registro atual.

## Exportação
Reutiliza `downloadAuditCsv` com array de um evento e arquivo evento-AUD-xxxx.csv. O exportador continua compatível com a listagem e agora inclui a coluna Justificativa. UTF-8/BOM, escaping e proteção de fórmulas preservados. Falha de download mantém dados e permite tentar novamente.

## Arquivos
- `src/pages/AuditOperationDetailsPage.tsx`, `.css` e `.test.tsx`
- `src/components/audit/AuditStatusBadge.tsx` e CSS compartilhados pela lista/detalhes
- `src/navigation/auditNavigation.ts` e testes
- `src/navigation/navigate.ts`
- `src/types/audit.ts`
- `src/data/auditRepository.ts` e `src/data/auditExport.ts`
- `src/pages/AuditPage.tsx`, CSS e testes (contexto e remoção dos testes específicos de modal, substituídos pelos testes da nova rota)
- `src/components/audit/AuditTable.tsx`
- `src/App.tsx`
- Removidos `AuditRecordDetails.tsx` e CSS, substituídos pela nova tela
- Spec, relatório de Auditoria e PROJECT_STATE.md atualizados

Sem dependências novas, commit ou push. Revisão visual manual em navegador não realizada nesta sessão.

## Validação final
- npm run verify aprovado: 165 testes em 14 arquivos. Dezesseis testes da página e dois de contexto de navegação; os quatro testes do modal foram substituídos.
- npm run build aprovado com avisos existentes de tamanho do bundle e comentários da dependência Zod.
- Um teste antigo de descarte de campanha excedeu 5s na primeira execução completa e passou na repetição; nenhum ajuste foi feito nesse teste ou na funcionalidade.
- git diff --check sem erros de whitespace.
