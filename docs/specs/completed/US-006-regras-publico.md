# US-006 — Regras e público

Data: 2026-10-14. Status: Completed.
Escopo autorizado: pedido anexado e imagem da terceira etapa.

## Diagnóstico e contrato
CreateCampaignPage controla um formulário/CampaignDraft, etapas 1|2, indicador e layout compartilhados. Expandir para 1|2|3, adicionar rules e migrar rascunhos antigos sem perder information/benefits. Etapa 2 permanece editável conforme pedido anterior.
Rules: público todos os clientes; combinação de condições E/OU; coleção de condições com id local, tipo valor total da compra, operador maior ou igual a e valor; combinação de restrições E/OU; coleção de restrições com id, tipo valor da compra, mínimo e máximo opcional (Sem limite).
Defaults: condição1 >= R$200,00 e restrição1 mínimo R$100,00/sem máximo. Novos itens têm valores vazios para edição. Seletores incluem apenas opções reveladas na imagem. Sem remoção, ação não representada no print.

## Implementação
Componente CampaignRulesForm exclusivo, wrappers existentes, radios nativos e coleções tipadas. Validação local de seleção, valor monetário não negativo com até 2 casas, mínimo obrigatório e máximo opcional >= mínimo. Não obrigar quantidade arbitrária de itens nem criar regras comerciais adicionais.
Continuar da etapa2 valida e avança; Voltar da3 retorna à2; estado único preservado. Continuar da3 valida e informa Escopo e canais pendente. Indicador sem salto livre. Resumo marca Público elegível conforme seleção; Condições de geração segue pendente conforme imagem.
Altura natural, grid de mesma largura, cards sem altura fixa/scroll interno, campos empilham no mobile; ignorar canvas excedente.

## Checklist
- [x] Tipos, migração, componente, validação e integração.
- [x] Testes de avanço, edição/adição, valores inválidos, preservação e rascunho.
- [x] Build/test/verify, diff e relatório final. Sem commit/push.

## Ajuste visual — 2026-10-14
Corrigida sobreposição do prefixo R$ com o valor: seletor do padding monetário tem prioridade sobre o padding genérico da página, inclusive nos breakpoints. Prefixo permanece sem quebra de linha.

## Ampliação autorizada — 2026-10-14
Pedido do usuário: acrescentar Excluir condição junto à adição existente. Cada condição recebe ação de exclusão local por ID; itens com valor preenchido usam ConfirmationModal existente e itens vazios são removidos diretamente. Preservar demais condições/restrições e permitir adicionar novamente após remover a última. Feedback de sucesso e foco em Adicionar condição após exclusão. Testes de cancelar/confirmar e preservação.
