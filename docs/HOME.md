# Home (Visão Geral) com Sidebar Global — entrega

Spec: `docs/specs/in-progress/US-012-home-sidebar.md`. Branch: `feat/03-pagina_home`.

## Padrão encontrado
React 19, TypeScript estrito, Vite, Tailwind 4, HeroUI 3 e Lucide. Sem roteador (`navigate()` por `history.pushState` + `popstate`). Telas com CSS semântico ao lado (`LoginPage`/`CampaignManagementPage` como referência). Nenhuma dependência adicionada.

## Referências usadas
- Não existe frame da Home no Figma. O visual segue os prints de Gerenciamento de Campanhas, Consulta de Vouchers e Relatórios e Indicadores, e o código já existente: cards brancos com borda e sombra leve, chips de ícone, chips de status, barras de utilização, botão vermelho de marca.
- A Sidebar tem os cinco itens da história. O Figma mostra também "Produtos e categorias" e "Estrutura organizacional"; não foram adicionados.
- As telas Consulta de Vouchers e Relatórios e Indicadores do Figma ainda não existem no código. A Sidebar já aponta para `/vouchers` e `/relatorios`, que mostram o estado "Em construção".
- As três branches enviadas (`feat/01_autenticacao-login`, `feat/01_ui-componentes-base-feedbacks`, `feat/02-criacao_campanhas`) são idênticas ou anteriores à `main`. O login real da US-011 (token, rotas protegidas) não existe em nenhuma; só as dependências `axios`, `msw` e `react-router` estão instaladas e sem uso. Por isso o usuário da Home é o mock `currentUser`.

## O que a Home entrega
- Rota `/home` (Login continua em `/`, pois a autenticação da US-011 ainda não está em `main`).
- Sidebar Global com Visão geral (ativa), Campanhas, Vouchers, Relatórios e Auditoria, e o perfil do usuário no rodapé.
- Cabeçalho exclusivo "Olá, Lucas!" com foto/avatar e subtítulo. **Sem `PageHeader`** (sem breadcrumb nem botão de ação).
- Banner "DESTAQUE DA SEMANA", pílulas de filtro por categoria e grid de cards de campanhas (mock).
- Estados: carregando, sucesso, vazio (categoria sem campanhas) e erro (com "Tentar novamente").

## Arquivos
Criados:
- `src/types/user.ts`, `src/types/home.ts`
- `src/data/currentUser.ts`, `src/data/homeOverview.ts` (mock + `fetchHomeOverview()`)
- `src/components/shared/UserAvatar.tsx` e `.css`
- `src/components/layout/navigation.ts`
- `src/components/home/`: `HomeGreeting`, `FeaturedBanner`, `CategoryFilter`, `HomeCampaignCard` (`.tsx` + `.css`), `categoryIcons.ts` e `formatters.ts`
- `src/pages/HomePage.tsx`, `.css`, `.test.tsx`
- `src/pages/SectionPlaceholderPage.tsx` e `.css`
- `docs/specs/in-progress/US-012-home-sidebar.md`, `docs/HOME.md`

Modificados:
- `src/App.tsx`: rotas `/home`, `/vouchers`, `/relatorios`, `/auditoria`.
- `src/components/layout/PortalLayout.tsx` e `.css`: navegação real por `navigate()`, item ativo por `activeSection`, `onNavigate` opcional (substitui `onCampaignNavigate`), perfil via `currentUser` + `UserAvatar`, hover nos itens. Os itens que mostravam um Toast "estará disponível" agora navegam.
- `src/pages/CreateCampaignPage.tsx`: usa `onNavigate`; qualquer item da Sidebar passa pela confirmação de descarte quando há alterações (antes só "Campanhas"). O texto do modal muda para "Deseja sair desta tela?" quando o destino não é Campanhas.
- `src/pages/CampaignManagementPage.tsx`: `activeSection="campaigns"`.
- `docs/PROJECT_STATE.md`, `agents.md`.

## Decisões e limites
- Textos do subtítulo, nomes das categorias, descrições e benefícios dos cards são provisórios, escritos no tom das outras telas.
- Foto de perfil: `currentUser.avatarUrl` está vazio de propósito, então aparece o ícone de usuário. Informe uma URL (ex.: arquivo em `public/`) para exibir a foto na Sidebar e na Home.
- O CTA do banner leva a `/campanhas` até existir uma página de detalhe. Os cards não têm ação.
- Quando a US-011 entrar: proteger `/` e `/home` apontando para `HomePage` e trocar `currentUser` por `useAuth()`.
- `fetchHomeOverview` é o único ponto a trocar pela API (contrato a definir com o backend).

## Validação
Não executada na sessão que gerou o código (sem acesso ao registro npm). Rodar no repositório: `npm install`, `npm run verify` e `npm run build`. Revisão visual: `npm run dev` e abrir `http://localhost:5173/home`.
