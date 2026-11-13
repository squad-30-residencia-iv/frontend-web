# US-023 — Completar integração do ciclo de campanhas

Status: Completed — revisão pelo backend local. Branch feat/11_rotas-api. Escopo autorizado em 2026-11-12.

- Reutilizar services/campaigns, matriz de permissões, ConfirmationModal, feedback e MSW existentes.
- POST /api/v1/campaigns/{id}/pause: Active → Paused; POST .../end: Active/Paused → Ended. Analista e gestor, sem retomada.
- Mostrar status devolvido pelo servidor; cancelamento sem requisição; falha mantém dados e modal; bloqueio de duplicidade existente.
- Guardas antes de qualquer gravação do wizard: teto percentual, lote e múltiplas restrições não suportados pelo contrato. Não enviar parcialmente nem descartar silenciosamente. Manter rascunho local.
- Não criar serviços/endpoints hipotéticos para vouchers, auditoria ou relatórios: dependem dos contratos públicos do backend.
- Testes MSW de permissões/status, confirmação/cancelamento, sucesso/falha/repetição e persistência; verify e build.

Fonte vigente: ../backend-api local, HEAD 0e5e8e6569c4a69cf6b40830fd30266e89388190. CampaignsController, Campaign/EffectiveStatus, BusinessTime, AuthenticationSetup, ApiProblems e DTOs de campanha conferidos somente por leitura.

## Validação anterior (antes da revisão local)
- [x] Integração reutilizando os serviços, modal e matriz existentes.
- [x] Guardas de compatibilidade e preservação do rascunho.
- [x] Testes MSW e de UI: 346 testes em 35 arquivos aprovados no npm run verify (19 novos).
- [x] npm run build aprovado; avisos de bundle >500 kB e anotações Zod existentes.
- [x] Guia da funcionalidade, workflow, agents.md e PROJECT_STATE atualizados.
- Sem servidor real ou revisão visual manual nesta sessão. Sem commit/push.

## Revisão solicitada: contrato local, somente leitura do backend
Referência: ../backend-api, HEAD 0e5e8e6569c4a69cf6b40830fd30266e89388190. Nenhum comando de build, execução, migração ou alteração será aplicado no backend.
- Alinhar mocks ao status efetivo (vigência, minuto final e saldo), erros de autenticação/perfil/escopo e dados de resposta da API local.
- Validar os estados retornados pelo servidor, sem assumir rascunho para um status desconhecido. Atualizar referência temporal do detalhe remoto.
- Revalidar guardas de compatibilidade pelos DTOs locais.
- Atualizar testes e documentação, rodar verify e build apenas no frontend-web.

## Fechamento da revisão local
- [x] Rotas e DTOs verificados no backend local, sem alterações nele.
- [x] Status efetivo, minuto final, saldo/reservas e códigos de erro refletidos nos mocks.
- [x] Detalhe e validação de respostas alinhados; guardas do wizard mantidas.
- [x] npm run verify: 355 testes em 35 arquivos aprovados. npm run build aprovado.
- [x] Backend com mesmo HEAD e Git limpo ao término; não executado nem migrado por esta task.
- Sem commit/push.
