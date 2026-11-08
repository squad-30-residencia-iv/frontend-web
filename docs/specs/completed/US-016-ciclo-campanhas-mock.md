# US-016 — Ciclo de aprovação de campanhas com mock

Branch atual: feat/09_UI-com-mock (o pedido mencionou fear/09_UI-com-mock). Reutilizar a arquitetura, menu, Modal/ConfirmationModal, Button e feedback compartilhados, sem HTTP nem integração de autenticação.

## Decisões confirmadas pelo usuário
- Analista submete rascunho; gestor aprova/reprova pendente.
- Analista e gestor pausam ativa e encerram ativa ou pausada.
- Motivo da reprovação opcional. Sem retomada/reativação nem encerramento de agendada/reprovada/rascunho.
- Status existentes active/scheduled/paused/ended preservados; acrescentar apenas draft/pending/rejected, hoje ausentes. Agendada não é sinônimo de pendente.

## Implementação
Repositório existente será a fronteira das transições: validação central por papel/status, persistência local atômica de mudanças, notificação às páginas e guarda de operação duplicada. Falha simulável por parâmetro tipado/testes, sem aleatoriedade ou endpoints. Usuário mock recebe papel de campanha tipado separado do texto visual; sem inferir permissões da string de apresentação. Papéis desconhecidos não têm ações.

Menu da listagem/detalhes abre confirmação reutilizada; reprovação oferece campo opcional, encerramento explica fim definitivo. Substituir banner de aprovação genérica por campanha pendente real; remover Retomar dos detalhes. Criação deve salvar campanha em draft, substituindo ativação direta que burlava aprovação. Registros antigos criados em active mantêm compatibilidade. Dois registros demonstrativos finais passam a draft/pending, mantendo 80 campanhas e as sete linhas iniciais. Referência isolada dos detalhes também deve responder ao repositório.

- [x] Tipos, política de ações e repositório reativo
- [x] Confirmações/permissões na listagem/detalhes e criação em rascunho
- [x] Testes de transições, papéis, cancelamento, erro, carregamento e sincronização
- [x] npm run verify/build e documentação

Validação concluída: npm run verify aprovado (233 testes em 19 arquivos), incluindo 40 novos testes de política/repositório/UI. npm run build aprovado com avisos existentes de bundle/Zod. Sem chamadas HTTP, dependências novas, commit ou push. Revisão visual manual em navegador não realizada.

