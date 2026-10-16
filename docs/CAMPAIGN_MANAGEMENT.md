# Gerenciamento de Campanhas — entrega

## Padrão encontrado
React 19, TypeScript estrito, Vite, Tailwind 4, HeroUI 3, Lucide; exports nomeados e imports diretos. Sem roteador. Provider oficial de Toast já registrado em main.tsx. Vitest/Testing Library. CSS de novas telas adjacente, sem alterar o login ou os tokens globais.

## Referência e componentes
Reproduzidos sidebar escura, breadcrumb/título, botão Nova campanha, aviso de aprovação, quatro indicadores, busca/filtros, sete colunas, barras/status e paginação. Layout desktop prioritário; em celulares, navegação compacta, indicadores em duas colunas e tabela com rolagem própria.
Reutilizados Button, Input, Select, ConfirmationModal/Modal, Loading, EmptyState, useFeedback e FeedbackProvider. Dropdown oficial HeroUI usado porque não existe equivalente compartilhado; API conferida nos arquivos instalados. ConfirmationModal ganhou action approve, mantendo as anteriores.
Novos componentes: PortalLayout, CampaignManagementPage, CampaignActionsMenu.

## Arquivos
Criados:
- src/types/campaign.ts
- src/data/campaigns.ts
- src/components/layout/PortalLayout.tsx e PortalLayout.css
- src/components/campaigns/CampaignActionsMenu.tsx
- src/pages/CampaignManagementPage.tsx, CampaignManagementPage.css e CampaignManagementPage.test.tsx
- docs/specs/completed/US-003-gerenciamento-campanhas.md
- docs/CAMPAIGN_MANAGEMENT.md
Modificados: src/App.tsx, src/components/ui/ConfirmationModal.tsx e docs/PROJECT_STATE.md.

## Interações e mocks
Busca local ignora acentos e caixa; filtros de status e vigência combináveis, reinício da paginação ao filtrar, 7 itens/página, anterior/próxima e páginas numeradas. Limpar filtros no vazio. Menu acessível abre por teclado, fecha com Escape e retorna foco. Aprovar abre confirmação, permite cancelar, remove o aviso após confirmar e exibe Toast de sucesso local. Nova campanha mostra a mensagem de próxima etapa. Itens de navegação futuros mostram feedback informativo.
Dados: sete campanhas tipadas transcritas da imagem e 73 registros identificados como demonstrativos, totalizando 80 e correspondendo a 24 ativas, 8 agendadas, 3 pausadas e 45 encerradas. Variações percentuais são valores demonstrativos estáticos da referência. Sem requisições ou persistência. isLoading é uma prop para integração futura, sem atraso artificial.

## Acesso
Em frontend-web, executar npm run dev e abrir http://localhost:5173/campanhas. Login mantido em http://localhost:5173/. Nenhuma dependência adicionada.
O handler handleCreateCampaign e PortalLayout ficam prontos para a etapa de criação, sem formulário ou rota vazia.

## Diferenças e limites
- Período inicial Todos os períodos para exibir as sete campanhas de meses distintos; Últimos 30/90 dias usa vigência com base fixa explícita em 30/11/2024, coerente com o mock de 2024.
- Avatar usa ícone Lucide; fotografia da referência não foi fornecida como asset.
- Menu fechado na imagem não revela opções: apresenta aviso desabilitado, sem inventar editar/excluir ou regras críticas.
- Aprovação refere-se ao aviso genérico da imagem e não altera um registro identificado da tabela.
- Revisão visual no navegador não realizada: Computer Use não autorizado a controlar Google Chrome. Responsividade implementada em CSS, sem verificação visual de pixels.

## Validação
npm run build aprovado. Vite emite aviso de bundle JS acima de 500 kB.
npm test -- --run aprovado: 25 testes, incluindo 9 novos.
npm run verify aprovado (TypeScript e 25 testes). Sem script de lint.
Git status e git diff --stat executados. Branch feat/02-criacao_campanhas; repositório sem commits, pasta frontend-web inteira já não rastreada no início. Diff vazio por esse motivo. Nenhum git add, commit ou push.
