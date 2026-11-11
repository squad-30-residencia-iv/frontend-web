# 🧠 Estado Atual do Frontend (Project State)

> Atualizado em 2026-11-09. As seções Contexto, Tarefas e Últimas Entregas são o estado vigente. Os blocos de entrega mais abaixo são o diário da sessão em que foram escritos e não substituem estas seções.

---

## 📌 Contexto Geral

- **Sprint:** Sprint 1
- **Foco:** Com `VITE_USE_MOCK=false`, o portal autentica, lista campanhas, grava o rascunho e, no detalhe de um Guid, o analista submete e o gestor aprova ou reprova. O assistente grava lojas e canais, o rascunho da API pode ser reaberto e, fora de rascunho, a campanha é duplicada (D6). O administrador mantém rede, região, loja, categoria e produto em `/cadastros` e abre `/aplicacoes` para as aplicações satélite. Pausar, encerrar, vouchers, relatórios e auditoria continuam locais.
- **Última atualização:** 2026-11-11.

O que o portal faz hoje:

- Login com JWT (`POST /api/v1/auth/login`). A sessão fica no `localStorage` (`token`, perfil com `networkId`). Não há `GET /auth/me` nem `POST /auth/logout`: sair só limpa o armazenamento. Com o mock desligado, o login usa a API (`analista@empresa.com`, `gestor@empresa.com`, `admin@empresa.com`). Os testes do MSW continuam com `analista@portal.dev`, `gestor@portal.dev` e `admin@portal.dev`.
- Home e gerenciamento leem `GET /api/v1/campaigns?networkId=` com a rede da sessão. Sem campanha no banco, a lista fica vazia. O administrador não chama a rota. A listagem não oferece submeter, aprovar, pausar nem encerrar.
- O assistente, com rede na sessão, grava o rascunho: `POST /api/v1/campaigns` e os `PUT` de itens, quantidades, público, validade, restrições e condições. O id fica no navegador e é reaproveitado se um `PUT` falhar. Categorias, produtos e lojas vêm da API. Lojas e canais vão no `PUT /scopes`: a rede com os canais dela, ou cada loja com os canais escolhidos que ela opera.
- O detalhe de um Guid lê `GET /api/v1/campaigns/{id}`. O papel da sessão escolhe a ação: analista submete o rascunho; gestor aprova ou reprova a pendente. A tela mostra o status devolvido, inclusive **Agendada** quando o início ainda é futuro. Pausar e encerrar não aparecem (frontend-web#43). O rascunho mostra **Editar rascunho**, que abre `/campanhas/{id}/editar`; fora de rascunho, **Duplicar** cria outra campanha em rascunho e abre a edição dela. A configuração mostra o escopo gravado. Uso e vouchers recentes ficam vazios. Ids locais (`1`, `79`) continuam no repositório, com a matriz antiga.
- A consulta de vouchers, os relatórios e a auditoria continuam locais.
- Em `/cadastros`, só o administrador cria, edita, reativa e inativa rede, região, loja (com os canais Físico/Virtual), categoria e produto. Inativar pede confirmação e avisa a cascata. Analista e gestor não veem o item na Sidebar e, pela URL, veem "Acesso restrito". O histórico em `/vouchers/:id/historico` continua provisório.
- Em `/aplicacoes`, só o administrador lista, cria, inativa e rotaciona o segredo das aplicações satélite. O papel da sessão é `administrador`. A tela usa o MSW (`mocks/handlers/satellite.ts`).

---

## 🚧 Tarefas em Andamento

- [ ] Depende do backend-api#51 na `staging`: `PUT /scopes`, `PUT /campaigns/{id}` e `POST /duplicate`. Sem ele, salvar o assistente falha no `PUT /scopes`.
- [ ] US-016 Aplicações: conferir `/aplicacoes` com o mock desligado. As rotas de cadastro de aplicação ainda não existem na API; a tela fala com o MSW.
- [ ] Edição de campanhas fora do que a tela representa (região no escopo, condição de categoria, produto ou quantidade, validade por data fixa ou em horas, teto, benefícios diferentes por alvo): a tela avisa e substitui ao salvar (US-021, D-2).
- [ ] US-022 Cadastros: conferir `/cadastros` com o mock desligado, contra a API real. A escrita de categoria e produto pelo administrador já está no backend-api#52, na `staging`.
- [ ] Pausar e encerrar no detalhe de um Guid (frontend-web#43); hoje continuam só nas campanhas locais.
- [ ] Vouchers, relatórios e auditoria seguem locais.
- [ ] US-013 Relatórios: a tela está na `main`, com dados locais. A spec segue em `docs/specs/in-progress/US-013-relatorios-indicadores.md` porque `npm run verify` e `npm run build` não foram registrados nessa sessão. O checklist de casos de teste da spec também está desmarcado. Mover para `completed/` só depois do verify.
- [ ] US-012 Home: código e testes escritos. Falta `npm run verify`, `npm run build` e a revisão visual. A spec `US-012-home-sidebar.md` ainda diz que `/auditoria` é placeholder; isso foi substituído pela US-014/US-015.
- [ ] Specs desatualizadas, sem reabrir o trabalho: `in-progress/US-011-autenticacao-msw-jwt.md` é o rascunho anterior (cita `react-router` e checklist aberto). A spec válida é `completed/US-011-autenticacao-msw-jwt.md`. `in-progress/US-001-login.md` não descreve o login atual; a autenticação foi entregue na US-011. `completed/US-014-auditoria.md` ainda fala em modal; a US-015 trocou pelo detalhe em rota.
- [ ] Há três specs com o id US-013 (consulta de vouchers, detalhes da campanha e relatórios) e duas com US-012 (PageHeader e Home). O id do arquivo distingue qual é qual.

---

## ✅ Últimas Entregas Concluídas

- US-016: tela `/aplicacoes`, só do administrador (`allowedRoles` e item da Sidebar com `roles: ['administrador']`). Lista, cria, inativa e rotaciona o segredo das aplicações satélite da rede escolhida. O segredo aparece uma vez. Spec `completed/US-016-aplicacoes-satelite.md`. A listagem ainda é do MSW.
- US-022: tela `/cadastros`, só do administrador. Abas Hierarquia (rede → regiões → lojas) e Catálogo (categorias → produtos), com ativos e inativos e o status visível. Criar e editar em modal; loja exige ao menos um canal; rede leva o fuso IANA. Inativar é o `DELETE` com confirmação da cascata; inativo mostra "Reativar" (`PUT` com `isActive: true`). Recusa da API mostra `detail` ou a primeira mensagem de `errors`. Item "Cadastros" da Sidebar filtrado por papel (`roles` em `navigation.ts`). MSW com estado em `mocks/handlers/registry.ts`, que também passou a atender os seletores da campanha. Spec `completed/US-022-cadastros-no-portal.md`. `npm run verify` (junto da US-021): 30 arquivos, 304 testes, verde. `npm run build` verde, com os avisos de sempre (bundle e Zod). No navegador com o MSW, o administrador criou loja, inativou a rede e viu a cascata.
- US-021 (frontend-web#38): o assistente grava o escopo (`PUT /api/v1/campaigns/{id}/scopes`). "Toda a rede" vai como um local sem região nem loja; "Lojas específicas" manda cada loja com os canais escolhidos que ela opera (PR-11), e a etapa acusa a loja que não opera nenhum. O rascunho da API reabre em `/campanhas/{id}/editar`, preenchido pelo `GET`, e salvar grava nome e vigência no `PUT /campaigns/{id}` sem novo `POST`; a edição avisa o que a tela não representa. Fora de rascunho a rota explica que a mecânica congela na aprovação (D6), e o detalhe oferece **Duplicar** (nome e vigência editáveis), que abre a edição da cópia. O motivo da reprovação continua opcional. Detalhe e listagem mostram o escopo gravado. Spec `completed/US-021-escopo-e-ciclo-da-campanha.md`. `npm run verify`: 29 arquivos, 291 testes. `npm run build` ok. Os corpos enviados pelo portal foram repetidos contra a API real do backend-api#51 (6 cenários).
- US-020: no detalhe de um Guid, o analista submete e o gestor aprova ou reprova. O papel sai da sessão (`analista` / `gestor`), não do usuário fixo. Aprovar com início futuro mostra **Agendada**; reprovar mostra o motivo. Pausar e encerrar não aparecem. Ids locais seguem na matriz da US-016. Spec `completed/US-020-submeter-e-aprovar.md`. `npm run verify`: a suíte completa teve dois timeouts (descarte na criação e período na consulta de vouchers), que passaram isolados; os testes do detalhe passaram. No navegador, o analista submeteu "Rascunho do portal" e o gestor aprovou; a Home mostrou **Agendada**.
- US-019: o assistente grava o rascunho na API e o detalhe de um Guid lê `GET /api/v1/campaigns/{id}`. Seletores usam categorias, produtos e lojas da rede (lojas por região). Benefício extra e condições em "qualquer" bloqueiam o envio. Base de clientes, quantidade por concessão, faixas além da primeira e lojas e canais ficam só no navegador. Spec `completed/US-019-rascunho-na-api.md`. A suíte completa teve uma falha isolada em Relatórios ("Indicadores de vouchers"), que passou ao rodar de novo; os testes do rascunho passaram. No navegador, o analista criou "Rascunho do portal" com início em dezembro de 2026 e abriu o detalhe sem ações de status.
- US-018: Home e gerenciamento leem `GET /api/v1/campaigns?networkId=` da sessão. Quantidade é `totalVoucherLimit`, uso fica em zero, benefício da Home sai do primeiro item e o escopo da tabela é "Rede". Banco vazio mostra "Nenhuma campanha nesta rede". Administrador não chama a rota. Submeter, aprovar, pausar e encerrar saíram da listagem. Spec `completed/US-018-campanhas-da-rede.md`. `npm run verify` verde, com um timeout isolado da criação de campanha que passou ao rodar de novo. No navegador, com o mock desligado, o analista viu a lista vazia do Postgres (`200` em `:5026`).
- US-017: o login traduz o corpo real (`token`, `expiresIn`, `message`, `profile`) e guarda `networkId`. Papéis `analista`, `gestor` e `administrador`. O `401` mostra "E-mail ou senha inválidos.". Sair só limpa o `localStorage`. Spec `completed/US-017-sessao-na-api.md`. Login conferido no navegador de `localhost:5173` para a API em `:5026`.
- US-016: ciclo de campanhas em mock (submeter, aprovar, reprovar, pausar e encerrar), sem HTTP. Spec `completed/US-016-ciclo-campanhas-mock.md`.
- US-015: detalhe da operação em `/auditoria/:operationId`, no lugar do modal da US-014. Spec `completed/US-015-detalhes-operacao.md`.
- US-014: tela `/auditoria` com filtros, cards e CSV local. Spec `completed/US-014-auditoria.md` (o trecho do modal foi superado pela US-015).
- US-013 Relatórios: tela em `/relatorios` com filtros, indicadores e CSV local. Código na `main`; spec ainda em `in-progress/` até o verify.
- US-011: autenticação JWT, MSW e rotas protegidas. Spec `completed/US-011-autenticacao-msw-jwt.md`.
- US-013: detalhes da campanha em `/campanhas/:id` e consulta de vouchers em `/vouchers` (dois arquivos com o mesmo número).
- US-012: PageHeader global (`completed/US-012-pageheader-global.md`). A Home com Sidebar é a outra US-012 e segue em andamento no verify.
- US-002 a US-010: componentes base, criação de campanha em cinco etapas e conformidade do rascunho local.

---

## ⚠️ Bloqueios & Decisões Recentes

- Com `VITE_USE_MOCK=false` e `VITE_API_BASE_URL`, o navegador chama a API direto. O CORS libera a origem do portal, não cada usuário. `http://127.0.0.1:5173` não é a mesma origem de `http://localhost:5173`.
- Home, gerenciamento, o fim do assistente e o detalhe de um Guid leem ou gravam a API. Sem sessão, o assistente continua em `createCampaign`. Ids locais continuam em `getCampaignDetails`. Vouchers, relatórios e auditoria seguem em `loadVouchers` e `fetchReport`.
- A listagem de lojas exige `regionId`. O portal pede as regiões da rede e, para cada uma, as lojas ativas. Não existe `GET /establishments?networkId=`.
- O início padrão de outubro de 2026 já passou. A API responde `422` e a tela mostra a mensagem. No navegador, o início precisa estar no futuro.
- O que a tela pede e a API não grava: benefício extra no mesmo alvo e condições em "qualquer" impedem o salvamento. Mais de uma faixa, base de clientes, quantidade por concessão e a escolha de lojas e canais seguem com aviso e ficam no navegador.
- A listagem não muda status: um clique ali não pode gravar só na memória e parecer salvo no banco. Submeter, aprovar e reprovar ficam no detalhe e, para um Guid, chamam a API.
- Ids locais seguem a matriz da US-016: analista submete, gestor aprova para ativa ou reprova, e os dois pausam e encerram. Não há retomada. Um Guid não oferece pausar nem encerrar.
- A Home não usa `PageHeader`. O usuário da sessão vem do `AuthContext`, com fallback para os testes isolados.
- A HeroUI segue a paleta do portal pelos tokens `--accent`, `--danger`, `--background`, `--foreground`, `--surface`, `--muted`, `--border`, `--success` e `--warning`.
- Stack: React, TypeScript, Vite, Tailwind e HeroUI. Navegação própria em `App.tsx`, sem react-router.
- Cadastros: o `PUT` nunca envia `isActive: false`. Inativar tem um caminho só, o `DELETE` com confirmação. Reativar o pai não reativa os filhos; com o pai inativo, criar filho fica desabilitado e reativar filho volta `422` com a mensagem na tela.
- Itens da Sidebar com `roles` aparecem só para esses papéis. A página também confere o papel: esconder o link não protege a URL.

## Entrega 2026-11-05 — US-011: Autenticação JWT com MSW e Rotas Protegidas
- Autenticação conectada com JWT: login via `POST /api/v1/auth/login`, logout via `POST /api/v1/auth/logout` e me via `GET /api/v1/auth/me`.
- Interceptores Axios no `src/services/api.ts` injetam `Authorization: Bearer <token>` em requisições autenticadas e interceptam 401 para expirar a sessão e redirecionar para `/login?from=...`.
- `AuthContext` e `useAuth` fornecem estado de sessão autenticada (`user`, `isAuthenticated`, `isLoading`, `login`, `logout`), com restauração automática de sessão válida do `localStorage`.
- `ProtectedRoute` protege páginas privadas e redireciona sem token para `/login?from=...`, com suporte a verificação de papéis (`allowedRoles`).
- `PortalLayout` e `HomePage` exibem o usuário real autenticado na sessão (nome e perfil de analista/administrador) e botão "Sair" funcional, mantendo fallback gracioso para testes isolados.
- MSW implementado em `src/mocks/` (`handlers`, `browser`, `server`, `jwtUtils`, `enableMocking`), com usuários demonstrativos `analista@portal.dev` e `admin@portal.dev`, validação de tokens e revogação em logout.
- Suíte completa de testes criada: `src/mocks/handlers/auth.test.ts`, `src/contexts/AuthContext.test.tsx`, `src/services/tokenStorage.test.ts`, `src/services/loginValidation.test.ts`, `src/services/auth.test.ts`, `src/components/layout/PortalLayout.test.tsx`, `src/pages/LoginPage.test.tsx` e `src/App.test.tsx`.
- Spec concluída e movida para `docs/specs/completed/US-011-autenticacao-msw-jwt.md`.


## Entrega 2026-11-11 — US-016: Gerenciamento de Aplicações Satélite
- Módulo `/aplicacoes` exclusivo para o perfil `admin` (`requiredRole: 'admin'` na Sidebar e `allowedRoles={['admin']}` no `ProtectedRoute`). Analistas e gestores não visualizam o item nem têm acesso à rota.
- Listagem por rede com filtro de aplicações ativas/inativas e indicadores de totais.
- Inativação com modal de confirmação retirando a aplicação da lista de ativas.
- Criação com formulário (nome, clientId, rede e os 3 escopos) e exibição do segredo gerado uma única vez com ação de copiar e aviso de que não será exibido de novo.
- Rotação de segredo com modal de confirmação, exibição do segredo novo uma vez com ação de copiar e aviso de que o segredo anterior parou de valer para tokens novos.
- A listagem e o detalhe nunca expõem ou mantêm segredos antigos.
- O portal não chama `POST /satellite/token`, preservando a separação com PDV/e-commerce.
- Suíte de testes criada cobrindo serviços, componentes e autorização de rotas.

## Entrega 2026-11-05 — US-011: Autenticação JWT com MSW e Rotas Protegidas
- Autenticação conectada com JWT: login via `POST /api/v1/auth/login`, logout via `POST /api/v1/auth/logout` e me via `GET /api/v1/auth/me`.
- Interceptores Axios no `src/services/api.ts` injetam `Authorization: Bearer <token>` em requisições autenticadas e interceptam 401 para expirar a sessão e redirecionar para `/login?from=...`.
- `AuthContext` e `useAuth` fornecem estado de sessão autenticada (`user`, `isAuthenticated`, `isLoading`, `login`, `logout`), com restauração automática de sessão válida do `localStorage`.
- `ProtectedRoute` protege páginas privadas e redireciona sem token para `/login?from=...`, com suporte a verificação de papéis (`allowedRoles`).
- `PortalLayout` e `HomePage` exibem o usuário real autenticado na sessão (nome e perfil de analista/administrador) e botão "Sair" funcional, mantendo fallback gracioso para testes isolados.
- MSW implementado em `src/mocks/` (`handlers`, `browser`, `server`, `jwtUtils`, `enableMocking`), com usuários demonstrativos `analista@portal.dev` e `admin@portal.dev`, validação de tokens e revogação em logout.
- Suíte completa de testes criada: `src/mocks/handlers/auth.test.ts`, `src/contexts/AuthContext.test.tsx`, `src/services/tokenStorage.test.ts`, `src/services/loginValidation.test.ts`, `src/services/auth.test.ts`, `src/components/layout/PortalLayout.test.tsx`, `src/pages/LoginPage.test.tsx` e `src/App.test.tsx`.
- Spec concluída e movida para `docs/specs/completed/US-011-autenticacao-msw-jwt.md`.


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

## Entrega 2026-10-27 — US-014: Auditoria
- /auditoria substitui placeholder: PortalLayout audit, PageHeader e Exportar histórico, quatro cards calculados, filtros locais aplicados por botão/Enter e paginação acessível de sete registros.
- Repositório centralizado tipado com 80 registros: oito campanhas, três responsáveis e 45 críticas; números coerentes em vez dos totais conflitantes da imagem. Primeiras três linhas da referência preservadas.
- Detalhes em Modal compartilhado pelo menu HeroUI: alterações antes/depois, motivo de bloqueio, alertas prioritários, falha técnica e metadados conforme aplicabilidade. Sem blocos extras na página.
- Exportação CSV de todos os resultados filtrados (não só página atual), UTF-8/BOM, escaping e proteção contra fórmulas; download local e feedback de sucesso/erro. Nenhum endpoint ou dependência nova.
- Loading, success, vazio, erro/retry, filtros preservados em falha de exportação, responsividade e status com cores. Home e PageHeader tests ajustados à substituição do placeholder.
- Verify aprovado: 151 testes em 12 arquivos, incluindo 20 novos. Build aprovado com avisos existentes de bundle/Zod; diff --check limpo. Sem revisão visual manual em navegador nesta sessão.
- Relatório docs/AUDIT.md; spec completed/US-014-auditoria.md. Sem commit/push.
- Sugestão de commit: feat(audit): implementa auditoria com detalhes e exportação CSV.

## Entrega 2026-10-27 — US-015: detalhes da operação
- /auditoria/:operationId substitui o modal: PageHeader/PortalLayout audit, informações com badge reutilizado, tabela das alterações do evento e justificativa contextual, conforme referência.
- loadAuditRecord por ID no repositório único; primeiro evento atualizado centralmente com quantidade, término e canal do protótipo. Justificativa opcional e fallback operacional para bloqueio/alerta/falha.
- Exportar evento usa o mesmo CSV com um registro, nome de arquivo específico e coluna Justificativa. Estados loading/success/error/retry/not-found; proteção contra respostas antigas/troca de ID.
- Estado da listagem (campos, filtros aplicados e página) preservado no histórico com validação Zod. Retorno por botão, breadcrumb e Voltar nativo; acesso direto sem contexto usa lista inicial.
- Badge extraído para reutilização real lista/detalhes. AuditRecordDetails TSX/CSS removidos por terem sido substituídos pela rota; sem reorganização das demais telas.
- Verify final aprovado com 165 testes em 14 arquivos; 16 testes da página e dois de navegação, substituindo quatro testes do modal. Timeout isolado de teste preexistente de descarte passou na repetição completa, sem alteração desse teste.
- Build aprovado com avisos existentes de bundle/Zod; sem revisão visual manual em navegador nesta sessão. Sem commit/push.
- Relatório docs/AUDIT_OPERATION_DETAILS.md; spec completed/US-015-detalhes-operacao.md; docs/AUDIT.md atualizado.
- Sugestão de commit: feat(audit): adiciona detalhes da operação por ID e exportação do evento.

## Entrega 2026-11-05 — US-016: ciclo de campanhas com mock
- Branch feat/09_UI-com-mock preservada. Estados active/scheduled/paused/ended mantidos; acrescentados draft/pending/rejected sem usar Agendada como pendência de aprovação.
- Usuário confirmou: analista submete rascunho; gestor aprova/reprova pendente; ambos pausam ativa e encerram ativa/pausada; motivo da reprovação opcional. Sem retomada/reativação.
- Política única em campaignWorkflow e mutações no campaignRepository existente. Persistência de status/motivo por ID, validação novamente na confirmação, bloqueio concorrente e notificação reativa da listagem/detalhes (inclusive storage entre abas). Falha simulável não altera status.
- CampaignActionDialog reutiliza ConfirmationModal/Button/Input/feedback. Cancelamento, encerramento explícito, pending e guarda por ref impedem confirmação duplicada/fechamento. Erro mantém modal e dados para nova tentativa.
- Perfil mockado recebe campaignRole tipado separado do cargo visual; default manager, sem autenticação ou concessão por string do cargo. actorRole injetável nos testes; perfil desconhecido sem ações.
- Banner passa a aprovar campanha pendente real. IDs 79/80 são cenários draft/pending, mantendo total 80 e primeiras sete linhas. Referência isolada dos detalhes também reflete status do repositório.
- Criação agora salva campanha em draft (Salvar campanha), eliminando ativação direta que contornava aprovação; registros antigos active preservados. Motivo opcional de reprovação aparece nos detalhes quando informado.
- Verify aprovado: 233 testes em 19 arquivos; 40 novos (28 política/repositório e 12 UI). Build aprovado com avisos existentes de bundle/Zod, diff --check sem erros. Sem revisão visual manual em navegador nesta sessão.
- Spec completed/US-016-ciclo-campanhas-mock.md; relatório docs/CAMPAIGN_WORKFLOW.md; docs/UI_COMPONENTS.md atualizado. Sem HTTP, novas dependências, commit ou push.
- Sugestão de commit: feat(campaigns): implementa ciclo de aprovação e encerramento com mock.

## Entrega 2026-11-08 — US-019: rascunho, seletores e detalhe na API
- O fim do assistente, com rede na sessão, grava `POST /api/v1/campaigns` e os `PUT` de itens, quantidades, público, validade, restrições e condições. O id fica no navegador e é reaproveitado se um `PUT` falhar.
- Categorias, produtos e lojas ativas vêm da API. Lojas saem das regiões da rede. A escolha de loja e canal continua só no navegador.
- Benefício extra e condições em "qualquer" impedem o envio. Mais de uma faixa, base de clientes e quantidade por concessão geram aviso.
- O detalhe de um Guid lê a campanha gravada, sem vouchers inventados e sem submeter, aprovar, pausar ou encerrar. Ids locais continuam no repositório.
- `npm run verify`: a suíte completa falhou uma vez em Relatórios ("Indicadores de vouchers"); o mesmo teste passou isolado. Os testes do rascunho e do detalhe passaram. No navegador, o analista criou "Rascunho do portal" (início em 2026-12-01) e abriu o detalhe.
- Spec `completed/US-019-rascunho-na-api.md`. Sem rota nova no backend.

## Entrega 2026-11-08 — US-020: submeter e aprovar no detalhe
- No detalhe de um Guid, o papel da sessão escolhe a ação. O analista submete o rascunho; o gestor aprova ou reprova a pendente. A tela mostra o status devolvido.
- Aprovar com início futuro mostra Agendada. Reprovar mostra o motivo. Pausar e encerrar não aparecem. Ids locais seguem a matriz antiga.
- `npm run verify`: dois timeouts na suíte completa (descarte na criação e período na consulta de vouchers) passaram isolados. No navegador, o analista submeteu "Rascunho do portal" e o gestor aprovou; a Home mostrou Agendada.
- Spec `completed/US-020-submeter-e-aprovar.md`.

## Entrega 2026-11-09 — US-022: cadastros no portal
- `/cadastros` com `PortalLayout` (`registry`), `PageHeader` e abas da HeroUI. Colunas em cascata: escolher a rede abre as regiões e escolher a região abre as lojas; no catálogo, escolher a categoria abre os produtos. Ativos primeiro, depois por nome, com contagem de ativos e inativos.
- Formulário em modal com validação antes do envio (nome até 150, código de loja até 20, de produto até 30, fuso até 64 e reconhecido pelo navegador) e foco no primeiro campo inválido. A recusa da API fica dentro do modal, com os dados preservados.
- Inativar confirma com o aviso da cascata; o toast diz o que caiu junto. Depois de gravar, as listas abertas recarregam sem perder a escolha.
- Analista e gestor: sem item na Sidebar e "Acesso restrito" pela URL, sem chamada à API.
- `services/registry.ts` lê as listas de forma defensiva. `services/problemDetails.ts` concentra a mensagem do ProblemDetails, agora também usada em `services/campaigns.ts`.
- MSW com estado para as cinco rotas: cascata, nomes e códigos repetidos, pai inativo e `403` para quem não é administrador. As leituras de categorias, produtos, regiões e lojas saíram de `mocks/handlers/campaigns.ts`.
- Testes: `RegistryPage.test.tsx` (10) e três casos novos em `PortalLayout.test.tsx`. `npm run verify` e `npm run build` verdes.
- Spec `completed/US-022-cadastros-no-portal.md`. Commit local em `task/cadastros-no-portal`, sem push.
