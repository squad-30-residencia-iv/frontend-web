# 🧠 Estado Atual do Frontend (Project State)

> Atualizado ao final de cada sessão de desenvolvimento.

---

## 📌 Contexto Geral

- **Sprint:** Sprint 1
- **Foco:** Componentes base e feedbacks sobre a stack React existente.
- **Última atualização:** 2026-10-10.

---

## 🚧 Tarefas em Andamento

- [ ] US-001 Login: o formulário já usa `Input`, `Button` e `FeedbackAlert`. A spec segue em `docs/specs/in-progress/` com checklist em aberto (stack, layout, testes da spec, verify/build e documentação).

---

## ✅ Últimas Entregas Concluídas

- Configuração inicial do ecossistema de SDD (prompts, templates e governança).
- US-002: Button, Input, Select, Modal, ConfirmationModal, Loading, EmptyState, FeedbackAlert e feedbacks via Toast oficial HeroUI 3.2.6.
- Documentação dos componentes em `docs/UI_COMPONENTS.md`. A vitrine `/ui.html` foi removida.
- Paleta do portal em `src/styles.css`: cores próprias no `@theme` e tokens da HeroUI apontando para a mesma paleta.
- Validação: `npm run build`, `npm test -- --run` e `npm run verify` aprovados; 16 testes. Sem script de lint.

---

## ⚠️ Bloqueios & Decisões Recentes

- Stack React + TypeScript + Vite, Tailwind, HeroUI e Lucide já instalada ao iniciar esta task.
- Preservados App, login, estilos globais e dependências. Novos componentes em `components/ui` conforme escopo solicitado, com exports nomeados e CSS semântico adjacente.
- Toast usa fila/provider oficiais; nenhum Context adicional. O app tem uma única entrada, `index.html`, e abre o login.
- A HeroUI segue a paleta do portal pelos tokens `--accent`, `--danger`, `--background`, `--foreground`, `--surface`, `--muted`, `--border`, `--success` e `--warning`. O login não força mais um vermelho local.
- `npm run verify` aprovado nesta sessão: typecheck e 16 testes.
- Spec US-001 não foi concluída; permanece em `docs/specs/in-progress/`.
- Alterações de tema prontas para commit, sem push. Sugestão: `feat(theme): padroniza a paleta do portal nos tokens da HeroUI`.

## Entrega 2026-10-13 — US-003
- Gerenciamento de Campanhas em /campanhas, login preservado em /; sem roteador, backend ou dependências adicionais.
- PortalLayout reutilizável; busca, status/período, paginação, menu acessível e aprovação local com confirmação/Toast.
- Mocks tipados com sete registros da imagem e 73 demonstrativos. Totais coerentes com os indicadores.
- ConfirmationModal aceita approve além das ações existentes.
- Build aprovado; teste e verify aprovados com 25 testes. Sem lint. Aviso Vite de bundle >500 kB.
- Spec concluída em docs/specs/completed/US-003-gerenciamento-campanhas.md; relatório em docs/CAMPAIGN_MANAGEMENT.md.
- Revisão visual no Chrome indisponível por falta de autorização do Computer Use.
- Branch feat/02-criacao_campanhas sem commits; frontend-web já não rastreado ao iniciar. Sem commit/push.

## Entrega 2026-10-13 — US-004
- Nova campanha navega para /campanhas/nova por history/pathname; App acompanha popstate sem roteador. Login preservado.
- CreateCampaignPage reproduz a primeira etapa: informações, vigência e validade do voucher; resumo, salvar rascunho e continuar.
- Rascunho tipado em information, persistência local validada, erros junto aos campos e feedbacks compartilhados.
- Retorno por breadcrumb/sidebar com confirmação de alterações não salvas; aviso de recarga via beforeunload. Voltar nativo do navegador não interceptado pelo modal.
- Próximas etapas não implementadas; handleContinue valida e informa etapa pendente, mantendo dados.
- Build aprovado; testes e verify aprovados: 36 testes (11 novos). Sem lint; aviso Vite de bundle >500 kB.
- Navegador integrado indisponível; revisão visual não realizada.
- Spec concluída US-004-criacao-campanha-informacoes.md; relatório docs/CREATE_CAMPAIGN.md.
- Branch feat/02-criacao_campanhas inicialmente limpa no repositório frontend-web. Sem commit/push.

## Entrega 2026-10-13 — US-005
- Segunda etapa Alvos e benefícios integrada ao mesmo CreateCampaignPage/CampaignDraft; avanço validado e retorno sem perda de dados.
- Descontos, alvos múltiplos, máximo de vouchers, geração automática/lote e total calculado; opções locais demonstrativas.
- Select compartilhado suporta multiple mantendo single padrão; APIs conferidas nas tipagens instaladas.
- Rascunhos anteriores migram preservando information. Salvamento existente inclui benefits.
- Etapa 2 com altura natural/rolagem normal do documento, sem sobra de captura ou min-height artificial.
- Etapa 3 pendente; handleContinue preparado e feedback compartilhado. Login/gerenciamento preservados.
- Build/test/verify aprovados: 46 testes. Sem lint. Aviso Vite de bundle >500 kB; revisão visual indisponível.
- Relatório docs/CAMPAIGN_BENEFITS.md; spec US-005-alvos-beneficios.md concluída. Sem commit/push.

## Ajuste 2026-10-14 — edição da segunda etapa
- Removidos bloqueios condicionais dos inputs e seletores de Alvos e benefícios conforme pedido do usuário.
- Radios preservam a seleção para validação; total previsto continua calculado.
- Testes existentes atualizados para verificar edição e cálculo também no modo não selecionado.
