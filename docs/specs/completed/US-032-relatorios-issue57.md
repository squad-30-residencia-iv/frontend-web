# US-032 — Relatórios: estrutura, integração e filtros (#57)

Escopo aprovado pelo pedido de 25/11/2026. Branch feat/14_ajustes-relatorio-integracao-filtro.

Diagnóstico inicial: ReportsContent condicionado ao catálogo/campanhas; adaptadores acessam campos sem validar e seletores duplicam all. Loader atual já está dentro do effect: preservar essa correção, depender de escopo primitivo e cancelar transporte ao desmontar. Exportação já possui separador ; e BOM.

Contrato confirmado no backend remoto main (local não possui Reports): ReportsController, ReportContracts e ReportService. networkId obrigatório Guid, period 30d/90d/6m, campaignId/regionId/establishmentId opcionais Guid. Catálogo só campanhas, regiões, estabelecimentos. Ticket médio retornado null; série mensal cobre seis meses independentemente do período.

- Estrutura sempre montada: layout/header/filtros/KPIs/gráficos/rankings, incluindo loading/erro/zero/admin sem rede.
- HTTP com AbortSignal, timeout local de relatórios, validação/normalização de campos ausentes sem substituir falhas por dados mockados. Erros de contrato inválido são explícitos.
- Auth usa somente catálogo real e quatro filtros; categoria/rede/tipo de cliente ocultos e descartados da URL/CSV. Modo local isolado preserva filtros que o mock realmente implementa.
- Draft/applied separados, cascata região/loja, Aplicar/Limpar/chips atualizam overview e CSV. Nada de ids vazios/all/invalidos na requisição.
- Reutilizar componentes/tema; não tocar backend ou ciclo de campanhas. Referência visual aguarda imagem do usuário (task7 não corresponde à issue7).
- Testes de sessão, vazio, catálogo parcial, filtros/params, erro/retry, admin, cancelamento, estabilidade e exportação. verify e build obrigatórios. Sem commit/push.

## Resultado técnico

- npm run verify: 419 testes passaram em 43 arquivos (inclui os 30 focados em Relatórios).
- npm run build: passou.
- git diff --check: passou.
- Implementação funcional e ajustes visuais concluídos com a imagem recebida em 25/11/2026. Não afirmar comparação pixel a pixel: navegador integrado indisponível e ferramenta não autorizou Chrome.
- Backend e ciclo de campanhas preservados; sem commit/push.

Fontes conferidas por leitura: https://github.com/squad-30-residencia-iv/backend-api/blob/main/src/VoucherCampaigns.Api/Controllers/ReportsController.cs ; https://github.com/squad-30-residencia-iv/backend-api/blob/main/src/VoucherCampaigns.Application/Reports/ReportContracts.cs ; https://github.com/squad-30-residencia-iv/backend-api/blob/main/src/VoucherCampaigns.Application/Reports/ReportService.cs .

## Referência visual recebida

Imagem anexada em 25/11/2026: usar o painel superior (filtros/chips, cinco KPIs, dois gráficos de mesma largura e duas tabelas). Monitoramento operacional é escopo da Auditoria conforme decisão anterior, não adicionar dados ou endpoints para reproduzir esse segundo painel. Manter quatro filtros reais e CSV, mesmo que o protótipo apresente mais filtros e não mostre exportação. Ajustar proporções, rosca compacta, legendas e gráfico sem grades conforme imagem; preservar dados reais e acessibilidade.

## Fechamento

Após ajustes da referência: verify aprovado novamente (419 testes/43 arquivos), build aprovado, diff --check aprovado. Sem commit/push. Conferência visual no navegador não realizada pelo bloqueio de acesso registrado.
