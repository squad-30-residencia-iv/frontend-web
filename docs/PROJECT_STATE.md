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
- [ ] US-011 Autenticação com JWT, MSW e rotas protegidas (branch `feat/01_autenticacao-login`): em andamento. Spec em `docs/specs/in-progress/US-011-autenticacao-msw-jwt.md`.
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

## Entrega 2026-10-14 — US-006
- Regras e público integra o único CreateCampaignPage/CampaignDraft, com step1|2|3 e navegação validada entre etapas.
- Público, combinações E/OU, coleções de condições/restrições editáveis com IDs estáveis e adição local.
- Tipos/operadores revelados na referência; valores monetários válidos, mínimo obrigatório e máximo opcional >= mínimo.
- Rascunhos anteriores recebem rules sem perder information/benefits. Campos da etapa 2 seguem editáveis.
- Layout de altura natural reutilizado; sem canvas excedente ou scroll interno.
- Etapa 4 pendente; feedback e handler preparados para Escopo e canais.
- Build/test/verify aprovados: 55 testes. Sem lint; aviso Vite de bundle >500 kB. Revisão visual indisponível.
- Spec US-006-regras-publico.md e relatório docs/CAMPAIGN_RULES.md. Branch inicialmente limpa; sem commit/push.

## Ajuste 2026-10-14 — excluir condição
- Cada condição recebe Excluir condição com ícone Lucide e botão compartilhado.
- Itens preenchidos usam ConfirmationModal; vazios são removidos diretamente. Exclusão por ID preserva demais itens; foco retorna a Adicionar condição.
- Permite remover a última condição e adicionar outra. Sem alterações nas restrições.
- Build/verify aprovados com 58 testes (3 novos de exclusão). Sem commit/push.

## Entrega 2026-10-14 — US-007: legibilidade
- JSX das telas/componentes exclusivos expandido, com props em linhas separadas; CSS formatado em blocos de propriedades.
- Primeira etapa isolada em CampaignInformationForm, consistente com BenefitsForm e RulesForm, mantendo o único estado na página.
- Renderização explícita por etapa; resumo usa itens nomeados/completos em vez de ternário encadeado por índice.
- Filtros do gerenciamento têm condições nomeadas; callbacks de busca/status/período/limpeza/aprovação e mudanças de etapa extraídos em handlers.
- Visual, textos, validações, persistência e fluxo preservados. Sem dependências ou mudanças no login.
- Build e verify aprovados com 58 testes; aviso habitual de bundle. Sem testes novos por ser refatoração; suíte existente mantida.
- Sem commit/push. Sugestão: refactor(campaigns): melhora legibilidade das telas e formulários.

## Entrega 2026-10-14 — US-008
- Quarta etapa Escopo e canais integrada ao mesmo CreateCampaignPage/CampaignDraft, preservando legibilidade e dados das quatro seções.
- Toda a rede ou lojas específicas, busca local por código/nome, adição/remoção e canais físico/virtual editáveis.
- Rascunhos antigos recebem scope default; catálogo de três lojas demonstrativas separado da renderização.
- Validação de lojas/canais e revalidação das etapas anteriores com retorno/foco ao primeiro erro.
- Usuário esclareceu: validar a quarta etapa e deixar Revisão pendente. Sem conclusão simulada, limpeza do rascunho ou atualização da listagem nesta etapa.
- Altura natural, sem canvas excedente ou scroll interno; layout/componentes base reaproveitados.
- Build aprovado; verify aprovado com 67 testes (9 novos). Sem lint; aviso Vite de bundle >500 kB. Revisão visual não realizada.
- Relatório docs/CAMPAIGN_SCOPE.md; spec US-008-escopo-canais.md concluída. Sem commit/push.

## Entrega 2026-10-14 — US-009
- Quinta etapa Revisão integrada ao mesmo CampaignDraft; quarta preservada como Escopo e canais.
- Três seções da referência apresentam dados reais das quatro etapas, com datas, reais, percentuais, nomes de IDs, listas e limites formatados por helper puro.
- Voltar5->4 preserva dados; correções pelas etapas anteriores atualizam a revisão. Sem inventar Editar ausente na imagem.
- Validador geral reutiliza validadores existentes, retorna à primeira etapa inválida e foca o campo; usado antes da revisão e ao salvar.
- Salvar conclui de forma simulada, remove só o rascunho local existente, mostra sucesso e retorna ao gerenciamento. Novo formulário inicia limpo; falha de limpeza mantém dados e informa erro.
- Listagem segue mockada, sem nova persistência/API/timeout. Layout com altura natural e sem sobra do canvas.
- Build aprovado; test aprovado e verify final com80 testes (13 novos). Sem lint; aviso Vite de bundle >500kB. Revisão visual não realizada.
- Relatório docs/CAMPAIGN_REVIEW.md; spec US-009-revisao-campanha.md concluída. Sem commit/push.

## Entrega 2026-10-15 — US-010: conformidade EP-01
- Zod instalado; schemas por etapa e composição completa, mantendo mensagens/foco existentes.
- Fim estritamente posterior ao início, desconto percentual de 1 a 100 e quantidades positivas.
- Revisão conclui com Ativar campanha; configuração completa persistida no mock local e nova campanha ativa incluída na listagem com indicadores coerentes.
- Repositório separado das páginas; falhas preservam formulário/rascunho, registros corrompidos não são sobrescritos.
- Cinco etapas preservadas conforme protótipos solicitados; diferença dos quatro passos da issue documentada em docs/CAMPAIGN_EP01.md. Público Todos os clientes preservado.
- Verify aprovado com 90 testes em seis arquivos; build aprovado com avisos de tamanho de bundle e comentários da dependência Zod. Sem commit/push.
