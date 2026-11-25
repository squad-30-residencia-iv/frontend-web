# Relatórios e indicadores — /relatorios

## Integração e escopo

A sessão com rede consulta GET /api/v1/reports/catalog?networkId= e GET /api/v1/reports/overview. O cliente Axios compartilhado anexa o JWT e mantém o tratamento existente de 401. Administrador sem rede vê Rede não definida, com estrutura zerada e sem requisições ou dados locais substituindo a API.

Filtros autenticados: Período (30d, 90d, 6m), Campanha, Região e Estabelecimento. campaignId, regionId e establishmentId são Guid opcionais; networkId é obrigatório e vem da sessão. Valores all, vazios e inválidos não são enviados. Categoria, Rede e Tipo de cliente ficam ocultos e são descartados da URL/CSV nessa modalidade, pois o overview não os aceita. O mock isolado sem sessão mantém apenas para testes os filtros locais que implementa.

Os seletores editam draft. Aplicar filtros, Limpar filtros e remoção de chip atualizam applied, query string e overview. Região restringe as lojas disponíveis. Campos, aplicação e limpeza são desabilitados durante a consulta; CSV usa somente o resultado dos filtros aplicados.

## Correção da tela vazia (#57)

A versão anterior condicionava ReportsContent ao catálogo e à existência de campanhas e o adaptador acessava listas e KPIs sem validação. Campos ausentes (especialmente percentuais undefined em formatPercent) podiam gerar exceção na renderização. As opções all também eram duplicadas pelo serviço e pelo seletor.

Agora layout, header, filtros, cinco KPIs, gráficos e rankings permanecem montados em carregamento, erro, zero e ausência de escopo. Zero é um sucesso explícito (Nenhum voucher encontrado), sem botão de criar campanha substituindo a página. Erros de HTTP/contrato aparecem com mensagem e Tentar novamente, preservando a estrutura. Ausência de campos opcionais é normalizada para listas vazias, contagens zero e taxas null; tipos inválidos são recusados como erro de contrato, sem inserir dados fictícios.

Cada effect cria um AbortController e repassa signal ao Axios, com timeout de 15 segundos apenas nestes serviços. Cleanup aborta a requisição e descarta respostas antigas. Dependências usam networkId/noScope e loaders estáveis, nunca o objeto user recriado nem uma função wrapper criada a cada render. Nesta branch o loader já era resolvido dentro do effect; essa regra foi mantida e coberta por regressão.

## Exportação

Reutiliza reportFormatters: relatorio-vouchers.csv, separador ;, decimal pt-BR, cabeçalhos legíveis, filtros aplicados no topo, BOM UTF-8 e proteção contra fórmulas. Download local, sem endpoint adicional. URLs temporárias são liberadas em finally. Sem resultado, permanece desabilitado conforme comportamento existente. Falha de download apresenta mensagem, sem quebrar a página.

## Limitações reais do backend

- AverageTicket retorna null; a tabela e o CSV apresentam ausência de valor, sem ticket médio inventado.
- A série mensal cobre sempre os últimos seis meses; o period recorta KPIs, status e rankings, mas não essa série. Campanha/região/loja filtram a série.
- Categoria e tipo de cliente exigem uma issue de extensão de contrato se forem obrigatórios no Figma. Não são filtros simulados. Rede é o escopo da sessão.
- Ranking vem ordenado por resgatados/emitidos; o front preserva o retorno da API.
- A cópia local do backend não contém Reports; contrato conferido por leitura da main remota, sem alterar arquivos backend.

Fontes: https://github.com/squad-30-residencia-iv/backend-api/blob/main/src/VoucherCampaigns.Api/Controllers/ReportsController.cs e https://github.com/squad-30-residencia-iv/backend-api/blob/main/src/VoucherCampaigns.Application/Reports/ReportContracts.cs e ReportService.cs no mesmo diretório.

## Visual e validação

Componentes, tokens e estrutura da tela existente foram reutilizados. Filtros em card responsivo com quatro seletores, Aplicar filtros, Limpar filtros e chips. Imagem do Figma recebida em 25/11/2026. O painel superior orientou os ajustes: dois gráficos de mesma largura, rosca compacta, legendas, linhas de tabela mais compactas e barras sem grades/eixo numérico visível, preservando títulos e tabela acessível. O painel Monitoramento operacional permanece no escopo da Auditoria, conforme decisão documentada. Os quatro filtros suportados e a exportação CSV permanecem mesmo quando diferem do protótipo.

Tentativa de inspeção da prévia: navegador integrado indisponível e acesso ao Chrome não autorizado pela ferramenta. Não foi realizada comparação visual da página renderizada; essa limitação fica registrada. A prévia temporária foi encerrada.

Spec: docs/specs/completed/US-032-relatorios-issue57.md. Testes: ReportsPage, ReportsApiPage, services/reports e reportFormatters, além da suíte completa do projeto. Resultados finais registrados na spec.

## Arquivos da issue #57

- src/pages/ReportsPage.tsx, ReportsPage.test.tsx e ReportsApiPage.test.tsx.
- src/services/reports.ts e reports.test.ts.
- src/types/report.ts; src/data/reportFilters.ts.
- src/components/reports/ReportFiltersForm.tsx, ReportFiltersForm.css e reportFormatters.ts.
- src/pages/ReportsPage.css; src/components/reports/ReportBarChart.tsx, ReportCharts.css, ReportKpiCards.css e ReportTables.css.
- src/mocks/handlers/portalReads.ts.
- docs/REPORTS.md, docs/PROJECT_STATE.md e docs/specs/completed/US-032-relatorios-issue57.md.

Validação técnica em 25/11/2026: verify aprovado (419 testes/43 arquivos); build aprovado; diff --check aprovado. Imagem recebida e usada como referência. Conferência no navegador não realizada por indisponibilidade/ausência de autorização da ferramenta.
