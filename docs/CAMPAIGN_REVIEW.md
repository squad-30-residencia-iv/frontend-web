# US-009 — Quinta etapa: revisão geral

## Integração e dados
Revisão é a quinta etapa, após Escopo e canais. CreateCampaignPage mantém o único formulário e CampaignDraft; CampaignReview lê o mesmo objeto, sem cópia ou estado de revisão. O indicador mostra quatro etapas concluídas e Revisão ativa. O resumo marca Condições de geração completo quando o fluxo inteiro está válido na quinta etapa; a marcação de Escopo solicitada anteriormente foi preservada.
Três seções seguem a imagem:
- Informações: nome, vigência com hora, modelo/validade/teto do voucher e rede/lojas/canais da etapa4.
- Alvo e benefícios: tipo/valor de desconto, aplicação, tipo e nomes de alvos, máximo de vouchers, quantidade por cliente, geração, benefícios adicionados e dados relevantes do modo automático ou lote.
- Regras e público: público, combinações E/OU, condições e restrições com seus valores/limites.
Todos os valores vêm do draft. getCampaignReviewSections separa apresentação do estado: datas dd/mm/aaaa hh:mm, reais BRL, percentuais/números pt-BR e nomes relacionados a IDs. Não altera o rascunho. Campos vazios usam Não informado, Sem limite ou indicação de ausência de itens, sem valores técnicos.

## Navegação e edição
Continuar da etapa4 revalida as quatro seções e abre5. Voltar da revisão retorna4 preservando dados; o usuário pode continuar voltando para corrigir qualquer etapa e avançar novamente. Não foram inventados botões Editar: não aparecem no print. Indicador continua sem salto livre para etapas futuras.
Salvar rascunho permanece disponível na revisão e usa a persistência local já existente. Reabrir começa na primeira etapa com o rascunho salvo; as etapas seguintes preservam os dados.

## Validação geral e salvamento
validateCampaignDraft reúne os validadores existentes, identifica o primeiro erro na ordem1->4 e retorna erros de cada seção. É usado antes de revisar e novamente ao clicar Salvar. Erro retorna à etapa correspondente, exibe mensagens e foca o primeiro campo, sem apagar dados.
Se válido, Salvar remove somente o rascunho existente da persistência local, mostra Campanha criada com sucesso via useFeedback e navega para /campanhas. O formulário é limpo ao desmontar e iniciar novo fluxo sem rascunho armazenado. Não há API, requisição fictícia, espera artificial ou banco de campanhas. Se não for possível remover o rascunho local, mantém a revisão e os dados, informa erro e permite tentar novamente.
A listagem permanece com os mocks existentes. A criação é apenas uma conclusão simulada do fluxo: não persiste uma campanha nem insere uma linha adicional. A futura integração deve enviar o contrato real à API e atualizar a listagem após confirmação do servidor.

## Layout, reutilização e diferenças
Reutilizados PortalLayout/sidebar/cabeçalho, indicador, resumo, Button, feedbacks/provider, alerta e modal de descarte existentes. CampaignReview é o novo componente de etapa; os grupos/fields são renderizados por coleções tipadas, sem componentes triviais adicionais.
Mesma largura e estilos de altura natural já usados pelas etapas. Cards crescem com valores reais; textos longos quebram, seções ficam empilhadas e não há scroll interno nem área vazia para imitar o canvas do print. Voltar foi mantido conforme requisito funcional, embora não apareça no recorte. Cards exibem valores reais e têm largura/altura suficientes para leitura, em vez de copiar os exemplos vazios do protótipo.
Nenhuma tela de revisão foi criada na quarta etapa. Nenhum dado de exemplo foi fixado no JSX. Sem revisão visual no navegador por indisponibilidade das ferramentas da sessão; nenhuma comparação pixel a pixel realizada.

## Arquivos
Criados:
- src/components/campaigns/create/CampaignReview.tsx
- src/components/campaigns/create/CampaignReview.css
- src/data/campaignReview.ts
- src/data/campaignReview.test.ts
- docs/specs/completed/US-009-revisao-campanha.md
- docs/CAMPAIGN_REVIEW.md
Modificados:
- src/pages/CreateCampaignPage.tsx
- src/pages/CreateCampaignPage.test.tsx
- src/data/campaignDraft.ts
- docs/PROJECT_STATE.md
- docs/CAMPAIGN_SCOPE.md
Login, gerenciamento, dependências e contratos das quatro etapas preservados.

## Acesso e validação
npm run dev em frontend-web. Abra /campanhas/nova na porta anunciada pelo Vite e avance preenchendo as quatro etapas.
Build aprovado, com aviso Vite de chunk JS acima de500kB.
npm test -- --run aprovado na primeira execução (79 testes); verify final aprovado com TypeScript e80 testes em5 arquivos, incluindo o teste adicional de retorno à etapa inválida. Total de13 testes novos nesta etapa.
Sem script de lint. git status, git diff --stat e git diff --check conferidos ao finalizar. Sem commit/push.
Sugestão: feat(campaigns): adiciona revisão geral e salvamento simulado.
