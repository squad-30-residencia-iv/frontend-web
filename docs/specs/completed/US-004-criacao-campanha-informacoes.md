# US-004 — Criação de campanha: informações

Data: 2026-10-13. Status: Completed.
Escopo autorizado: pedido anexado e imagem da etapa Informações.

## Diagnóstico e contrato
React/TypeScript estrito, exports nomeados, CSS semântico adjacente, wrappers Button/Input/Select/Modal/FeedbackAlert/useFeedback e PortalLayout. Navegação por pathname, sem roteador; Toast provider em main.tsx. Login preservado. Branch feat/02-criacao_campanhas inicialmente limpa no repositório frontend-web.
CampaignDraft contém information: nome, início/fim datetime-local, modelo relativo, duração em dias e teto sem limite; strings para permitir campos intermediários vazios. Nenhuma propriedade de etapas futuras.

## Implementação autorizada
- /campanhas/nova via botão Nova campanha, histórico nativo e popstate; sem dependências.
- Primeira etapa da imagem, resumo dinâmico, campos controlados e validação local (nome, datas válidas/ordem, duração inteira positiva e seleções).
- Breadcrumb Campanhas e sidebar retornam; modal compartilhado confirma descarte de alterações não salvas. beforeunload protege recarga/fechamento.
- Salvar rascunho persiste apenas localStorage com leitura validada; salvar incompleto é permitido. Continuar valida, mantém dados e informa próxima etapa pendente.
- Somente opções visíveis Prazo relativo e Sem teto. Datas iniciais 01/10/2026 08:00 e 31/10/2026 23:59; nome vazio com placeholder da imagem.
- Sem backend, autenticação, novas etapas, commit/push ou alterações visuais no login.

## Checklist
- [x] Tipos, estado controlado, layout e navegação.
- [x] Testes de navegação, formulário, validação, rascunho, descarte e continuidade.
- [x] Build, testes, verify, status/diff e documentação.
