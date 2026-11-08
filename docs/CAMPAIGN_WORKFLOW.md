# Workflow de campanhas com mock — US-016

Implementado na branch feat/09_UI-com-mock. A tarefa foi solicitada como fear/09_UI-com-mock; a branch real existente foi preservada. Não há chamadas HTTP, endpoints ou integração de autenticação nesta funcionalidade.

## Status e permissões
Os status existentes `active`, `scheduled`, `paused`, `ended` foram preservados. Apenas `draft` (Rascunho), `pending` (Pendente de aprovação) e `rejected` (Reprovada) foram adicionados. Agendada é diferente de pendente de aprovação.

| Ação | Origem | Destino | Papel |
|---|---|---|---|
| Submeter | draft | pending | analyst |
| Aprovar | pending | active | manager |
| Reprovar | pending | rejected | manager |
| Pausar | active | paused | analyst ou manager |
| Encerrar | active ou paused | ended | analyst ou manager |

Pausa/encerramento para ambos os papéis e motivo opcional na reprovação foram confirmados pelo usuário. Não há retomada, reativação, submissão repetida ou encerramento de agendada/rascunho/reprovada. Papéis desconhecidos não têm ações. A UI oculta opções inválidas; o repositório valida novamente na confirmação, incluindo caso o status tenha mudado enquanto o diálogo estava aberto.

## Papel atual
`currentUser.campaignRole` é a permissão tipada (`manager` ou `analyst`), separada da string visual `currentUser.role`. O mock padrão continua Lucas Silva/Gestor de Marketing e usa manager. Para testar como analista no aplicativo, configure campaignRole: analyst em `src/data/currentUser.ts` e ajuste o texto de apresentação se desejar. Os testes injetam actorRole nas páginas. Não foi criado seletor de perfis nem inferida autorização a partir do texto do cargo. Quando a autenticação entrar, este é o ponto de adaptação ao usuário autenticado. A validação é demonstrativa no front; a API futura deverá aplicar a política no servidor.

## Dados e integração
`campaignRepository.ts` permanece a fronteira única de leitura/mutação. `getCampaigns`, `getCampaignById`, `createCampaign` e `performCampaignAction` usam os mocks atuais e o armazenamento local. Política e textos das ações ficam em `campaignWorkflow.ts`.

Mudanças são persistidas em `portal-campaigns:status-changes:v1`, por ID, sem modificar os arrays-base. `useSyncExternalStore` notifica listagem/detalhes e responde a mudanças de armazenamento em outras abas. Persistência corrompida não é sobrescrita; falha de gravação não altera o status. Uma guarda por ID impede operações concorrentes sobre a mesma campanha.

O payload tipado da ação recebe campaignId, action, role, reason opcional e simulateFailure opcional. Para validar falha em teste/QA, use performCampaignAction com simulateFailure: true; a UI também tem teste de falha simulada que mantém o modal aberto e permite repetir. Não há falha aleatória nem tempo de espera artificial. No futuro, apenas a implementação desse repositório precisa ser trocada pela comunicação com o serviço real, preservando os componentes e contratos de ações.

## Interface
- Menu de cada campanha mostra apenas ações permitidas; detalhes oferecem as mesmas ações no cabeçalho/menu.
- Todas passam pelo ConfirmationModal compartilhado. Cancelar começa com foco; reprovação possui motivo opcional; encerramento explica a operação definitiva.
- Estado isPending e guarda imediata por ref bloqueiam confirmação duplicada, cancelamento e fechamento durante a execução.
- Sucesso persiste, atualiza os componentes sem reload, fecha o diálogo e mostra Toast. Falha mantém o status, os dados e o diálogo, com feedback de erro e nova tentativa.
- Banner de aprovação genérica foi substituído por campanha pendente real e aparece somente para gestor.
- A criação agora usa Salvar campanha e grava draft: não ativa diretamente nem burla aprovação. O rascunho do formulário incompleto continua no mecanismo existente de Salvar rascunho. Campanhas antigas criadas como active continuam compatíveis; o formato antigo sem status é lido como active.
- Dois registros demonstrativos finais (IDs 79 e 80) são rascunho e pendente. Sete linhas iniciais e total 80 foram preservados; indicadores são calculados. Pesquise rascunho/pendente ou filtre por status para testar.
- A referência dos detalhes material-novo-ideias-novas também usa o status do repositório. A ação Retomar foi retirada, pois não pertence à tarefa. Editar continua como ação em breve, fora deste escopo.
- Motivo informado na reprovação é exibido nos detalhes; sem motivo, não se apresenta bloco vazio. Performance/vouchers/datas de referência e demais painéis seguem demonstrativos; não foi adicionada emissão real de vouchers nem integração com Auditoria.

## Arquivos
- `src/types/campaign.ts`, `src/types/campaignDetails.ts`, `src/types/user.ts`
- `src/data/currentUser.ts`, `src/data/campaigns.ts`, `src/data/campaignRepository.ts`, `src/data/campaignDetails.ts`
- `src/data/campaignWorkflow.ts` e testes
- `src/components/campaigns/CampaignActionsMenu.tsx`, novo `CampaignActionDialog.tsx`
- `src/components/ui/ConfirmationModal.tsx` (ações/descrição/conteúdo opcionais, compatibilidade preservada)
- `src/pages/CampaignManagementPage.tsx` e CSS, `CampaignDetailsPage.tsx`, `CreateCampaignPage.tsx`
- Testes dessas páginas, do repositório e novo `CampaignWorkflow.test.tsx`
- Spec concluída e PROJECT_STATE.md

## Validação
npm run verify aprovado com 233 testes em 19 arquivos. Quarenta novos testes: 28 da política/repositório e 12 de UI, com cancelamento, sucesso, erro, motivo opcional, concorrência, modal pendente, estado desatualizado e sincronização. Não houve revisão visual manual em navegador. Sem commit/push.

Build final aprovado (npm run build), com avisos existentes de tamanho do bundle e comentários da dependência Zod. git diff --check sem erros de whitespace.
