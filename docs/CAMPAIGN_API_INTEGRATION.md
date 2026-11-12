# Integração do ciclo de campanhas — US-023

## Caminhos confirmados

A implementação reutiliza `services/api.ts`, `services/campaigns.ts`, `getCampaignActions`, `CampaignActionDialog`, `ConfirmationModal` e os feedbacks existentes. Não foi criada outra camada HTTP.

| Ação no detalhe | Endpoint | Estado de origem | Perfis |
| --- | --- | --- | --- |
| Submeter | POST `/api/v1/campaigns/{id}/submit` | Draft | Analista |
| Aprovar/reprovar | POST `.../{id}/approve`, `.../{id}/reject` | PendingApproval | Gestor |
| Pausar | POST `.../{id}/pause` | Active | Analista ou gestor |
| Encerrar | POST `.../{id}/end` | Active ou Paused | Analista ou gestor |

Pausa e encerramento enviam o POST sem motivo/corpo adicional. A tela usa o status da resposta; não força a transição no repositório local para campanhas reais. O GET posterior do detalhe/listagem lê o novo status. Não há retomada nem reativação. A listagem mantém o padrão de navegar ao detalhe para executar ações.

Cancelar não envia requisição. O diálogo bloqueia duplo clique, fechamento e cancelamento enquanto aguarda. No sucesso, fecha e exibe o feedback; na falha, mantém os dados exibidos e o diálogo para tentar novamente. Permissões/estado são refletidos na UI e validados novamente pelo servidor; o mock das novas rotas também verifica token, expiração, perfil e rede.

Fonte desta revisão: **backend local em ../backend-api**, HEAD `0e5e8e6569c4a69cf6b40830fd30266e89388190`, consultado somente para leitura. Controllers/Policies em `src/VoucherCampaigns.Api/Controllers/CampaignsController.cs` e `Authentication/AuthenticationSetup.cs`; DTOs em `src/VoucherCampaigns.Application/Campaigns/`; regras em `src/VoucherCampaigns.Domain/Campaigns/Campaign.cs` e `Common/BusinessTime.cs`; erros em `src/VoucherCampaigns.Api/Errors/ApiProblems.cs`. Códigos: `CAMPAIGN_PAUSE_NOT_ACTIVE` e `CAMPAIGN_END_NOT_ALLOWED` (422), `AUTH_FORBIDDEN_ROLE` e `SCOPE_FORBIDDEN` (403), `AUTH_UNAUTHENTICATED` (401).

## Compatibilidade do assistente

A revisão apresenta o impedimento antes do envio. `saveCampaignDraft` repete a guarda antes de qualquer POST/PUT, inclusive ao editar uma campanha existente. O rascunho e o ID salvo ficam preservados.

- O DTO de benefício não recebe teto monetário percentual: teto preenchido bloqueia o envio. Um valor antigo de teto não bloqueia o desconto fixo, onde não é aplicável.
- Não há geração em lote/base de clientes no contrato atual: lote fica disponível no rascunho local, mas bloqueia salvar na API.
- A API recebe uma faixa de compra, não uma coleção combinável de restrições: várias faixas bloqueiam o envio. Nenhuma restrição adicional é descartada para gravar apenas a primeira.
- Mantidos os impedimentos existentes: benefícios extras e combinação OU nas condições de geração. A API usa condições cumulativas.
- A quantidade por concessão continua explicitamente informada como local; limite por cliente e quantidade total são enviados pelos caminhos existentes.
- A edição de configurações que a tela não representa continua seguindo os avisos já existentes na US-021 (data fixa/horas, condição de categoria/produto, região e benefícios por alvo). Esta entrega não redesenha essas funcionalidades nem cria DTOs novos no backend.

Essas limitações exigem evolução do contrato antes de permitir salvar as mesmas configurações de UX no servidor. O front não pode atribuir significado a campos que o backend não recebe.

## Demais funcionalidades

Login, sessão, consulta/criação/edição/duplicação de campanhas, escopo, hierarquia e catálogos continuam nos serviços existentes. Vouchers/histórico, auditoria e relatórios permanecem locais: sem contrato de consulta confirmado para essas telas, não foram inventados endpoints nem feita uma integração parcial. A API de concessão por aplicação satélite não equivale à consulta gerencial de vouchers.

## Validação

Testes MSW de pausa/encerramento cobrem os dois perfis, estados permitidos/proibidos, confirmação/cancelamento, resposta persistida no mock, erro/repetição e concorrência. Testes de serviço verificam que configurações incompatíveis não iniciam gravações nem apagam o rascunho. Integração contra servidor real e revisão visual manual ainda não executadas nesta sessão.

Resultado final da revisão local: npm run verify aprovado (355 testes em 35 arquivos) e npm run build aprovado. Avisos existentes de bundle e anotações Zod. Sem commit/push.

## Revisão pelo backend local
- O status retornado é efetivo: a agendada que já começou pode ser ativa; ativa/pausada viram encerradas após o minuto final; emitidos e reservas podem esgotar a ativa. O front usa esse status, sem recalcular saldo/regra de negócio para liberar ações.
- O MSW reproduz essas regras para testar respostas, inclusive vigência mudando com o modal aberto. Não importa nem executa código do backend.
- O detalhe remoto usa o instante atual para o contador, e a fase respeita o status da resposta. Esgotada/cancelada não indicam emissão habilitada. Status fora do enum local são recusados; nunca viram rascunho por fallback.
- Os DTOs locais confirmam os impedimentos do wizard: benefício sem teto monetário, condições cumulativas e uma faixa de compra. A API local não recebe geração em lote. O rascunho local permanece disponível.
- Nenhuma alteração, build, migração ou execução foi feita em backend-api. Validação concluída somente no frontend: 355 testes e build aprovados. O Git do backend continuou limpo, com o mesmo HEAD.
