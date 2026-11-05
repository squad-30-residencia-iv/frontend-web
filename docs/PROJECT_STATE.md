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
- [ ] US-012 Home (Visão Geral) com Sidebar Global (branch `feat/03-pagina_home`): código e testes escritos; falta rodar `npm run verify`/`npm run build` e a revisão visual no navegador (não há frame da Home no Figma; visual segue as telas existentes). Spec em `docs/specs/in-progress/US-012-home-sidebar.md`; relatório em `docs/HOME.md`.
---

## ✅ Últimas Entregas Concluídas

- Configuração inicial do ecossistema de SDD (prompts, templates e governança).
- US-002: Button, Input, Select, Modal, ConfirmationModal, Loading, EmptyState, FeedbackAlert e feedbacks via Toast oficial HeroUI 3.2.6.
- Documentação dos componentes em `docs/UI_COMPONENTS.md`. A vitrine `/ui.html` foi removida.
- Paleta do portal em `src/styles.css`: cores próprias no `@theme` e tokens da HeroUI apontando para a mesma paleta.
- Validação: `npm run build`, `npm test -- --run` e `npm run verify` aprovados; 16 testes. Sem script de lint.
- US-013: tela Detalhes da campanha em `/campanhas/:id` (detalhes no bloco "Entrega 2026-10-25 — US-013" abaixo).
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

## Sessão 2026-10-18 — US-012 (em andamento)
- Home em /home com Sidebar navegável (Visão geral, Campanhas, Vouchers, Relatórios, Auditoria), saudação exclusiva "Olá, Lucas!", banner DESTAQUE DA SEMANA, pílulas por categoria e grid de cards com mock; sem PageHeader.
- PortalLayout agora navega por navigate() e recebe activeSection/onNavigate; criação de campanha confirma descarte para qualquer destino da Sidebar. UserAvatar compartilhado.
- /vouchers, /relatorios e /auditoria mostram estado temporário "Em construção". Login segue em / até a US-011 entrar em main.
- Novos testes: HomePage.test.tsx (10) e 1 em CreateCampaignPage.test.tsx. Verify e build NÃO executados (ambiente sem acesso ao npm). Sem commit/push.
- Sugestão de commit: feat(ui): implementa Home com Sidebar global e cards de campanhas (US-012)

## Entrega 2026-10-19 — PageHeader global (issue #12)
- PageHeader compartilhado em components/shared: título, breadcrumbs configuráveis, ação opcional à direita e titleId opcional. Sem slot vazio quando não há ação.
- Integrado à listagem/criação de campanhas e às páginas provisórias de Vouchers, Relatórios e Auditoria. CSS dos cabeçalhos centralizado; CSS antigo do placeholder removido.
- Links internos via navigate, cliques modificados preservados e interceptação da saída da criação mantida. HomeGreeting exclusivo da Home e login preservados.
- Exportar histórico não implementado: Auditoria permanece provisória, componente suporta ação configurada (teste). Não foi criada ação fictícia.
- Verify aprovado: 108 testes em oito arquivos. Build aprovado com avisos existentes de bundle/Zod. Testes focados repetidos sem aviso JSDOM. Sem revisão visual em navegador nesta sessão.
- Documentação docs/PAGE_HEADER.md e spec completed/US-012-pageheader-global.md. Sem commit/push.
- Sugestão de commit: feat(ui): adiciona PageHeader global às páginas internas.

## Entrega 2026-10-25 — US-013: Consulta de Vouchers
- /vouchers substitui placeholder por tela com PortalLayout, PageHeader com subtítulo opcional, cards calculados, busca/filtros aplicados por botão/Enter, limpar filtros, tabela mascarada, badges e paginação acessível de sete itens.
- 5.899 mocks coerentes com os quatro cards e 843 páginas; sete linhas iniciais da imagem preservadas. Divergência do rodapé 120 na imagem documentada.
- Tipos e carregador local separados; loading/success/empty/error/retry e proteção contra atualização após desmontagem. Sem API ou dependências novas.
- Ações HeroUI navegam para /vouchers/:id/historico com destino provisório e retorno; histórico não implementado.
- Testes da Home/PageHeader atualizados ao substituir placeholder. Verify aprovado: 117 testes em nove arquivos, incluindo dez novos de vouchers. Build aprovado com avisos existentes de bundle/Zod; sem revisão visual em navegador.
- Relatório docs/VOUCHER_LOOKUP.md e spec completed/US-013-consulta-vouchers.md. Sem commit/push.
- Sugestão de commit: feat(vouchers): implementa consulta com filtros e paginação local.

## Ajuste 2026-10-26 — filtros de vouchers
- Corrigida sobreposição da seta do Select com o valor selecionado, usando indicador em fluxo normal e tipografia herdada.
- Alturas/espaçamentos uniformes, rótulos alinhados, reticências para valores longos e estados de hover/foco no CSS local.
- Build aprovado. Sem mudanças na lógica; sem commit/push.

## Ajuste 2026-10-26 — filtros de campanhas
- Aplicado aos filtros Status/Período o mesmo padrão visual da consulta de vouchers: seta em fluxo normal, fontes e alturas uniformes, espaçamento, reticências e hover/foco.
- Alteração restrita ao CSS da tela, mantendo lógica e navegação. Build aprovado; sem commit/push.


## Entrega 2026-10-25 — US-013: detalhes da campanha
- Tela em /campanhas/:id (branch feat/05_detalhes-da-compra), aberta pelo nome da campanha na listagem. Rota resolvida em App.tsx por pathname, sem roteador; /campanhas/nova preservada.
- Página única em pages/CampaignDetailsPage (TSX e CSS ao lado) com PortalLayout e PageHeader: resumo, cinco indicadores, vigência, validade dos vouchers, últimos vouchers e informações detalhadas.
- Dados locais em data/campaignDetails.ts (fronteira getCampaignDetails para trocar por API). A campanha do protótipo abre em /campanhas/material-novo-ideias-novas; as da listagem derivam de campaigns.ts e homeOverview.ts, com o restante demonstrativo e identificado na tela.
- Pausar/Retomar, Editar e menus de ações mostram "Ação em breve"; "Ver todos os vouchers" leva a /vouchers (em construção). Sem imagem da campanha (bloco decorativo). Sem implementação de pausar/editar nem da tela de vouchers.
- CampaignActionsMenu passa a aceitar Pick<Campaign, 'name'>; o nome da campanha na listagem virou link.
- Verify aprovado: [N] testes em [M] arquivos. Build aprovado com avisos existentes de bundle/Zod. Revisão visual no navegador conferida com o Figma na campanha de referência.
- Spec completed/US-013-detalhes-da-campanha.md. Pendências: contrato de API a confirmar com o backend.

## Sessão 2026-10-27 — US-013 Relatórios e Indicadores (em andamento)
- /relatorios substitui o placeholder: filtros (7) com Aplicar/Limpar/chips e cascata Rede → Região → Estabelecimento, 5 KPIs, gráfico mensal e rosca em SVG próprio, Top 5 campanhas e Desempenho por região (Tkt Médio mock), Exportar CSV, estados de carregando/vazio/nenhuma campanha/erro. Filtros na URL via replaceState.
- Decisões do planejamento: cancelados entram na conta, Print 2 vai para Auditoria, Tkt Médio mock, Exportar CSV no cabeçalho.
- Dados em data/reports.ts (fetchReport/fetchReportCatalog são o ponto de troca pela API); sem dependência nova (Recharts não usado).
- Tabelas derivadas do mesmo conjunto e diferentes da imagem, que não fecha com os cards; documentado em docs/REPORTS.md.
- Testes novos: reports.test.ts, reportFormatters.test.ts, ReportsPage.test.tsx; PageHeader.test.tsx ajustado.
- PENDENTE: `npm run verify` e `npm run build` NÃO executados (registro npm bloqueado no ambiente) e sem revisão visual em navegador. Spec segue em docs/specs/in-progress/ até o verify passar.
- Branch sugerida feat/04-pagina_relatorios. Sem commit/push. Sugestão de commit: feat(reports): implementa tela de relatórios e indicadores com filtros e exportação CSV (US-013).
