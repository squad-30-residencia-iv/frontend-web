# Grupos destinatários do lote

Na etapa Alvos e benefícios, selecione Em lote e escolha um ou mais grupos em Grupos de clientes. Os grupos selecionados aparecem abaixo com a quantidade de clientes e podem ser removidos individualmente ou todos de uma vez.

O total previsto usa clientes únicos dos grupos selecionados × quantidade por cliente. Clientes presentes em dois grupos são contados uma única vez. O total não pode exceder o limite de vouchers da campanha. A revisão mostra nomes dos grupos e clientes únicos.

## Fonte dos dados

O projeto local não tem cadastro/consulta de grupos de clientes. O catálogo demonstrativo de campaignBatch.ts usa nomes explícitos e IDs sintéticos, sem CPFs. CampaignBatchGroups aceita outro catálogo pela prop groups, para facilitar futura integração. Não representa grupos reais já cadastrados e não faz requisições HTTP fictícias.

A API futura deve definir o catálogo e a união dos membros. Contagens isoladas por grupo não bastam para deduplicar clientes; a API pode devolver os membros autorizados ou calcular a união no servidor.

A seleção fica em memória entre etapas, é limpa ao trocar para Automática e não é salva no rascunho local. A conclusão do lote segue bloqueada enquanto não houver integração, sem cadastro de clientes ou emissão real. Backend e .env não foram alterados.

Esta versão substitui a importação CSV da US-026. Spec: docs/specs/completed/US-027-lote-grupos.md.
