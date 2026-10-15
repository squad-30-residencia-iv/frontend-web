# US-009 — Revisão geral e salvamento simulado
Data: 2026-10-14. Status: Completed.
Autorização: pedido anexado e imagem da quinta etapa.

## Diagnóstico/contratos
Fluxo real tem quatro etapas e quinta já definida no indicador. Manter Escopo e canais como etapa4; ampliar step para5 sem novo estado de campanha. Review lê CampaignDraft diretamente. Validadores das quatro seções existentes e persistência de rascunho local reaproveitados.

## Escopo autorizado
- Revisão com três seções do print: Informações (inclui rede/lojas/canais da etapa4), Alvo e benefícios e Regras e público. Valores reais formatados, IDs resolvidos e vazios claros; sem dados fixos de exemplo ou alterações do estado para exibir.
- Continuar da4 valida e abre5. Voltar5->4 preserva dados; edição pelo fluxo Voltar existente, sem inventar botões Editar ausentes na imagem.
- Salvar revalida todas as etapas; primeira inválida recebe erros/foco. Se válido, remove somente o rascunho local existente, mostra sucesso simulado e navega para gerenciamento. Se limpeza local falhar, mantém dados e mostra erro para tentar novamente. Sem API, timeout, banco fictício ou nova persistência; listagem mockada não recebe a campanha.
- Salvar rascunho continua disponível. Indicador5 ativo e anteriores concluídos; resumo completo na revisão válida.
- Componentes/CSS adjacentes legíveis; altura natural, sem sobra do print ou scroll interno. Sem login/dependências/refatoração geral/commit/push.

## Checklist
- [x] Formatação, revisão, validação geral e integração.
- [x] Testes de conteúdo, preservação, validação geral e salvamento/limpeza.
- [x] Build/test/verify, diff e relatório.
