# Criação de campanha — primeira etapa

## Navegação e arquitetura
O botão existente Nova campanha abre /campanhas/nova usando history.pushState e atualização por popstate. App continua selecionando a página por pathname; useSyncExternalStore acompanha o histórico sem biblioteca de rotas. /campanhas mantém a listagem e / mantém o login.
PortalLayout é reutilizado e recebe callback opcional para retorno pelo link Campanhas e pela marca. Breadcrumb Campanhas retorna à listagem. Links preservam Ctrl/Cmd/Shift para abrir em outra aba.

## Tela e interações
Criada somente CreateCampaignPage, com indicador das cinco etapas visíveis (Informações é a atual), formulário Informações básicas, validade do voucher, resumo da configuração e botões Salvar rascunho/Continuar. Etapas futuras são indicadores, sem telas ou botões de navegação fictícios.
Campos controlados: nome, início e fim da vigência com hora, modelo de validade, duração em dias e teto máximo. Modelo: Prazo relativo; teto: Sem teto, únicas opções especificadas pela imagem.
Nome obrigatório sem aceitar apenas espaços; datas/hora obrigatórias e válidas; fim não anterior ao início; duração inteira positiva; seleções obrigatórias. Erros próximos aos campos e foco no primeiro inválido. Resumo marca informações completas somente após validação de todos os campos desta etapa.
Salvar rascunho aceita preenchimento incompleto e persiste localmente, sob portal-campaigns:creation-draft:v1. Leitura valida estrutura; armazenamento indisponível gera feedback sem limpar o formulário. Rascunhos inválidos são ignorados. Voltar e reabrir restaura o último salvamento. Descartar remove alterações não salvas da sessão, mantendo eventual rascunho anterior.
Retorno pelos links da tela abre o Modal compartilhado se há alterações não salvas; cancelar preserva dados e restaura foco. Recarga/fechamento usa beforeunload enquanto há alterações; o navegador pode exigir interação prévia para mostrar seu aviso. O modal não intercepta o botão Voltar do próprio navegador; salve o rascunho para retomá-lo após sair por esse caminho.
Continuar valida e mantém a tela/dados, com Toast informativo sobre Alvos e benefícios ainda pendente. Tipo CampaignDraft estruturado por information e handler handleContinue prontos para conectar a próxima etapa.

## Reutilização
Button, Input, Select, Modal (confirmação de descarte), FeedbackAlert, useFeedback, FeedbackProvider já registrado, PortalLayout e ícones Lucide. Nenhum componente direto HeroUI recriado; nenhuma dependência adicionada. Componentes reais se chamam Button/Input/Select, não AppButton/AppInput/AppSelect.

## Arquivos
Criados:
- src/pages/CreateCampaignPage.tsx
- src/pages/CreateCampaignPage.css
- src/pages/CreateCampaignPage.test.tsx
- src/data/campaignDraft.ts
- src/navigation/navigate.ts
- docs/specs/completed/US-004-criacao-campanha-informacoes.md
- docs/CREATE_CAMPAIGN.md
Modificados:
- src/App.tsx
- src/pages/CampaignManagementPage.tsx
- src/pages/CampaignManagementPage.test.tsx
- src/components/layout/PortalLayout.tsx
- src/types/campaign.ts
- docs/PROJECT_STATE.md

## Acesso
Em frontend-web, execute npm run dev e use a porta mostrada pelo Vite:
- http://localhost:5173/campanhas → Nova campanha
- http://localhost:5173/campanhas/nova → acesso direto
Se o Vite anunciar 5174, use http://localhost:5174/campanhas/nova.

## Referência e limites
Datas iniciais iguais à imagem: 01/10/2026 08:00 e 31/10/2026 23:59; duração inicial 30 dias. Nome inicia vazio com placeholder Ex.: Volta às Aulas 2026. Por isso o resumo inicia pendente e fica completo ao preencher validamente.
Datas usam datetime-local: formatação e controles nativos variam conforme navegador/idioma. Seletores compartilhados mantêm sua seta. Duração editável numérica com unidade textual. Sidebar conserva o layout compartilhado e o avatar com ícone Lucide, sem fotografia fornecida.
Layout responsivo: colunas empilham, datas/validade adaptam, indicador de etapas rola dentro de sua região em telas estreitas. Revisão visual não realizada: navegador integrado indisponível e inventário de navegadores vazio.
Sem backend, autenticação, endpoints, novas etapas, commit ou push.

## Validação
npm run build aprovado; aviso Vite de bundle JS maior que 500 kB.
npm test -- --run e npm run verify aprovados: 36 testes em 4 arquivos (11 novos e teste do botão existente atualizado).
Sem script de lint. git diff --check, git status e git diff --stat executados no repositório frontend-web.
Sugestão de commit para revisão: feat(campaigns): adiciona primeira etapa de criação e navegação.
