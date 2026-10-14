# US-006 — Terceira etapa: Regras e público

## Integração e navegação
CreateCampaignPage continua sendo o único formulário, com o único CampaignDraft. A propriedade rules foi acrescentada ao contrato central, junto de information e benefits. Estado step agora aceita 1, 2 ou 3, reaproveitando layout, sidebar, cabeçalho, indicador e resumo.
Continuar valida a etapa 2 e abre a 3. Voltar da etapa 3 retorna à 2, e desta à 1, preservando todos os dados e itens. O indicador marca etapas anteriores concluídas e a atual com aria-current=step; não permite saltar validações. Foco acompanha o título da etapa.
Continuar da etapa 3 valida e mantém o formulário, mostrando feedback sobre Escopo e canais ainda pendente. Nenhuma quarta tela foi criada. O handler fica preparado para conectar a próxima etapa usando o mesmo draft.
A rota permanece /campanhas/nova. Para avaliar, abra essa URL na porta mostrada pelo Vite, preencha a primeira etapa e use Continuar nas duas etapas anteriores.

## Campos e interações
Público elegível: Todos os clientes, única opção revelada pela imagem.
Condições para geração: todas as condições (E) ou pelo menos uma (OU), via radios nativos acessíveis. Coleção de condições, cada uma com identificador local estável, tipo Valor total da compra, operador Maior ou igual a e valor monetário editável. Adicionar condição cria novo item sem apagar os anteriores.
Restrições: todas (E) ou pelo menos uma (OU). Coleção com identificadores estáveis, tipo Valor da compra, mínimo e máximo opcional. Adicionar restrição cria outro item editável. Máximo vazio representa Sem limite.
Defaults transcritos: uma condição de R$200,00, uma restrição com mínimo R$100,00 e sem máximo; combinações E. Itens novos recebem valores vazios para preenchimento. IDs UUID são criados apenas ao adicionar, preservados ao editar, voltar e salvar.
Sem remoção: essa ação não aparece na referência. Não foi inventada exclusão nem confirmação adicional. O modal de descarte de saída existente permanece para alterações não salvas.

## Validação e persistência
Público, tipos e operador obrigatórios; valores monetários válidos não negativos com até duas casas decimais; mínimo obrigatório; máximo opcional e não inferior ao mínimo. Erros são associados aos campos e o primeiro inválido recebe foco. Sem exigência comercial adicional de quantidade de itens, operadores ou públicos não especificados.
Salvar rascunho inclui as três seções na persistência local existente. A leitura valida a estrutura de rules, inclusive IDs únicos e formato seguro dos IDs. Rascunhos anteriores recebem defaults de rules, mantendo as etapas anteriores. Estrutura inválida de rules também recebe defaults, sem perder information/benefits.
Resumo marca Público elegível conforme seleção válida. Condições de geração permanece pendente conforme o print, sem antecipar configuração da etapa seguinte.

## Layout, reutilização e limites
Mesma largura do fluxo existente, cards de altura natural e rolagem vertical apenas no documento. A terceira etapa reaproveita os estilos existentes de altura natural; não inclui área escura/vazia excedente, altura baseada no print ou scroll interno. Campos ficam em uma coluna quando faltar espaço; indicador e botões seguem a responsividade atual.
Reutilizados PortalLayout, indicador/resumo, Button, Input, Select, Modal, FeedbackAlert, useFeedback/provider e Lucide. CampaignRulesForm é o único novo componente de etapa; MoneyField é um helper interno para os três campos monetários repetidos. Nenhum componente HeroUI direto, biblioteca, backend ou API adicionados.
Diferenças/interpretações: apenas as opções visíveis dos seletores foram implementadas; máximo Sem limite é placeholder para valor vazio; Voltar foi incluído conforme pedido explícito. Textos menores foram transcritos da imagem. A imagem é usada como referência de conteúdo/disposição, sem reproduzir o canvas excedente. Revisão visual no navegador não realizada por indisponibilidade das ferramentas de navegador na sessão; não há garantia de comparação pixel a pixel.

## Arquivos
Criados:
- src/components/campaigns/create/CampaignRulesForm.tsx
- src/components/campaigns/create/CampaignRulesForm.css
- src/data/campaignRules.ts
- docs/specs/completed/US-006-regras-publico.md
- docs/CAMPAIGN_RULES.md
Modificados:
- src/types/campaign.ts
- src/data/campaignDraft.ts
- src/pages/CreateCampaignPage.tsx
- src/pages/CreateCampaignPage.test.tsx
- docs/CREATE_CAMPAIGN.md
- docs/CAMPAIGN_BENEFITS.md
- docs/PROJECT_STATE.md
Login, gerenciamento, componentes base e edição habilitada da segunda etapa preservados.

## Validação
npm run build aprovado (aviso Vite de chunk JS acima de 500 kB).
npm test -- --run aprovado: 55 testes em 4 arquivos, 9 novos da terceira etapa e expectativas de avanço da segunda atualizadas.
npm run verify aprovado (TypeScript e testes). Sem script de lint.
git status, git diff --stat e git diff --check executados. Sem commit/push.
Sugestão de commit para revisão: feat(campaigns): integra regras e público ao fluxo de criação.

## Exclusão de condições — atualização 2026-10-14
Cada condição agora tem Excluir condição, conforme novo pedido. Valores preenchidos exigem confirmação pelo componente compartilhado; condição vazia é removida diretamente. A exclusão usa ID estável, preserva os demais itens e devolve foco a Adicionar condição. Pode excluir a última e adicionar novamente; restrições não foram alteradas.
