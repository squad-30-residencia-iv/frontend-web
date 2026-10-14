# US-008 — Quarta etapa: Escopo e canais

## Integração e decisão de escopo
A imagem representa Escopo e canais, com uma quinta etapa Revisão no indicador. O usuário esclareceu explicitamente que Continuar deve validar a quarta etapa e deixar a revisão pendente. Por isso não foi implementada conclusão simulada, limpeza do rascunho, revisão fictícia ou inclusão na listagem.
CreateCampaignPage mantém o único formulário e CampaignDraft; step agora aceita1|2|3|4. O novo scope contém modo rede/lojas, canais da rede, IDs das lojas e canais das lojas. As três seções anteriores continuam no mesmo estado, editáveis e preservadas.

## Tela e dados
CampaignScopeForm reproduz Escopo Organizacional, descrição, Toda a rede, canais Físico/Virtual e card Lojas específicas com busca e canais. Defaults sem seleção, como no print.
Toda a rede é um checkbox acessível: marcado escolhe rede; desmarcado escolhe lojas específicas. Os canais aceitam múltipla seleção, e ambos os grupos permanecem editáveis. Alternar modo não apaga escolhas anteriores. Adicionar uma loja específica seleciona esse modo.
Busca local por código/nome, ignorando acentos e caixa, com resultados, estado vazio e adição sem duplicatas. Lojas selecionadas aparecem com ação de remover, sem criar campos novos. Catálogo demonstrativo: 001 Loja Centro, 002 Loja Shopping, 003 Loja Online. No rascunho ficam apenas IDs, não cópias do catálogo. A busca é estado de UI; seleções são dados da campanha.
O placeholder Buscar por código ou cliente... foi mantido conforme o print; a busca efetiva utiliza código/nome de loja. Não há catálogo de clientes ou grupos de lojas inventado.

## Navegação, validação e preservação
Continuar da etapa3 valida regras e abre4; indicador marca as três anteriores concluídas e a quarta ativa; foco acompanha o título. Voltar retorna3 sem apagar dados; é possível voltar até1 e avançar mantendo todas as quatro seções.
Validação: uma loja válida ou mais no modo específico; ao menos um canal no modo escolhido. O modo não selecionado não bloqueia validação. Erros próximos aos campos/grupos, com foco no primeiro inválido.
Continuar da4 revalida information, benefits, rules e scope, retornando à primeira etapa inválida com foco e mensagens. Se tudo estiver válido, mostra Escopo e canais validados e informa Revisão pendente; mantém a tela e todos os dados. Não conclui campanha, conforme resposta explícita do usuário.
Salvar rascunho inclui scope na persistência local já existente. Rascunhos anteriores recebem scope default sem perder information/benefits/rules. Estrutura de scope é validada na leitura. Sem nova persistência de catálogo, API, backend ou requisições simuladas.

## Layout, componentes e limites
Reutilizados PortalLayout/sidebar/cabeçalho, indicador/resumo, Button, Input, EmptyState, Modal de descarte existente, FeedbackAlert, useFeedback/provider e Lucide. Radios/checkboxes nativos são usados quando não existe wrapper equivalente. ChannelOptions é um helper interno para os dois grupos repetidos de canais.
Mesma largura de conteúdo e estilos de altura natural já existentes. Não foi copiada a grande área vazia do print, não há altura fixa nos cards nem rolagem interna adicional. Em telas pequenas, canais e cards empilham.
Não há seções/botões Editar na referência; não foi criada uma revisão de dados ou ações de edição não representadas. Etapas anteriores são editáveis pelo fluxo Voltar.
Diferenças: lojas demonstrativas e resultados/seleções funcionais aparecem ao interagir; Toda a rede usa checkbox para permitir marcar/desmarcar. Avatar segue o ícone compartilhado existente. Sem revisão visual em navegador por indisponibilidade das ferramentas na sessão; nenhuma comparação pixel a pixel foi realizada.

## Arquivos
Criados:
- src/components/campaigns/create/CampaignScopeForm.tsx
- src/components/campaigns/create/CampaignScopeForm.css
- src/data/campaignScope.ts
- docs/specs/completed/US-008-escopo-canais.md
- docs/CAMPAIGN_SCOPE.md
Modificados:
- src/types/campaign.ts
- src/data/campaignDraft.ts
- src/pages/CreateCampaignPage.tsx
- src/pages/CreateCampaignPage.test.tsx
- docs/PROJECT_STATE.md
- docs/CAMPAIGN_RULES.md
Login, gerenciamento, dependências e componentes compartilhados preservados.

## Acesso e validação
npm run dev em frontend-web. Abra /campanhas/nova na porta anunciada pelo Vite e avance pelas três etapas anteriores.
Build aprovado com o aviso Vite de chunk acima de500kB.
Verify aprovado: TypeScript e 67 testes passando em 4 arquivos. Nove testes novos cobrem a quarta etapa; expectativas de avanço dos testes anteriores foram adaptadas. npm test -- --run foi executado e a falha de expectativa antiga identificada foi corrigida antes do verify final.
Sem script de lint. git status, git diff --stat e git diff --check conferidos ao finalizar. Sem commit/push.
Sugestão de commit para revisão: feat(campaigns): integra escopo e canais ao fluxo de criação.

## Ajuste do resumo — 2026-10-14
Escopo organizacional fica marcado ao acessar a quarta etapa, conforme pedido explícito do usuário. A marcação representa progresso; campos obrigatórios de lojas/canais continuam sendo validados ao continuar.
