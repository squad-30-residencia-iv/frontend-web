# US-008 — Escopo e canais

Data: 2026-10-14. Status: Completed.
Autorização: pedido anexado/imagem; usuário esclareceu que Continuar deve validar a quarta etapa e deixar Revisão pendente, sem concluir a campanha agora.

## Diagnóstico e contrato
CreateCampaignPage e CampaignDraft únicos, etapas 1|2|3 e componentes exclusivos, wrappers e CSS adjacentes legíveis. Branch inicialmente limpa. Expandir para 1|2|3|4 e scope: modo network/stores, canais da rede, IDs de lojas e canais das lojas.

## Escopo
Reproduzir Escopo Organizacional, Toda a rede, canais físico/virtual, busca e adição de lojas específicas. Lojas locais demonstrativas por ausência de API. Campos editáveis; escolhas alternativas preservadas. Validar ao menos uma loja no modo específico e ao menos um canal no modo selecionado. Defaults sem seleção, como na imagem.
Continuar da3 valida rules e abre4; Voltar retorna3 sem apagar as quatro seções; indicador anterior concluído. Continuar da4 revalida etapas anteriores e scope, retorna à primeira inválida se necessário; sucesso informa Revisão pendente e mantém dados. Nenhuma etapa5 ou conclusão simulada conforme esclarecimento explícito.
Rascunhos antigos recebem scope vazio/default sem perder dados. Altura natural, sem min-height artificial, espaços excedentes ou scroll interno. Não inventar revisão/edição de seções ausentes no print. Não alterar login/gerenciamento, instalar dependências, fazer commit/push.

## Checklist
- [x] Tipos, migração, componente e integração.
- [x] Testes de avanço, busca, seleção/canais, validação e preservação.
- [x] Build/test/verify, status/diff e documentação.

## Ajuste autorizado — resumo do escopo (2026-10-14)
Pedido do usuário: Escopo organizacional deve estar marcado na quarta etapa. O resumo marca o item ao acessar a etapa (visitedScope), conforme a referência, independentemente do preenchimento inicial. Isso é uma indicação visual de progresso; a validação real de lojas/canais continua obrigatória ao clicar Continuar. Teste existente de abertura da etapa atualizado para verificar a marcação.
