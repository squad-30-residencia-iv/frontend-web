# Relatórios e Indicadores

Rota `/relatorios` substitui o placeholder "Em construção". Usa `PortalLayout` (seção `reports`) e `PageHeader` com subtítulo e botão **Exportar CSV**. Só front-end com mock; spec em `docs/specs/in-progress/US-013-relatorios-indicadores.md`.

## Comportamento
- Filtros: Período, Campanha, Categoria, Rede, Região, Estabelecimento e Tipo de cliente. Os campos editam o `draft`; **Aplicar filtros**, **Limpar filtros** ou remover um chip atualizam o `applied` e disparam nova consulta.
- Combinação por AND. Filtro sem resultado é sucesso: visão zerada, aviso "Nenhum voucher encontrado", taxa "—" e Exportar CSV desabilitado.
- Cascata Rede → Região → Estabelecimento: as opções dependem da escolha anterior; valor incompatível é zerado. No mock, Franquias não atuam no Norte.
- URL: `?periodo=&campanha=&categoria=&rede=&regiao=&estabelecimento=&cliente=`, só com o que difere do padrão, via `replaceState`. Valores inexistentes ou combinações incompatíveis são ignorados na leitura.
- Chips: um por filtro (como na imagem); o "x" só aparece nos que diferem do padrão (Últimos 30 dias, Todas/Todos).
- Taxa de utilização = resgatados ÷ emitidos; "—" sem emitidos. Emitidos = resgatados + expirados + disponíveis + cancelados (validado pelo schema Zod).
- Gráfico mensal: sempre 6 meses (Jan-Jun), respeita todos os filtros menos Período. KPIs, rosca e tabelas respeitam o Período (30 dias = 1 mês, 90 dias = 3, 6 meses = 6 no mock).
- Top 5 campanhas ordenado por taxa; Desempenho por região ordenado por vouchers, com Tkt Médio mock fixo por região.
- Estados: carregando, sucesso, vazio, nenhuma campanha (com atalho "Criar campanha"), erro com "Tentar novamente" (catálogo e indicadores).
- Exportar CSV: separador ";", decimal ",", BOM UTF-8, filtros aplicados no topo, texto protegido contra fórmula.

## Mock e referência
Período padrão reproduz a imagem: 5.899 emitidos, 3.567 resgatados, 892 expirados, 1.284 disponíveis e 60,5%; cancelados = 156 (donut). As tabelas são derivadas do mesmo conjunto e por isso **não repetem** os números da imagem (Black Friday com 15.000 emitidos, por exemplo, excede o total de 5.899). Contagens por região são aproximadas dos 2.477/1.234/943/712/533 da imagem. Os dados vêm de 1.260 registros (campanha × estabelecimento × tipo de cliente × mês) gerados deterministicamente em `src/data/reports.ts`.

## Arquivos
- `src/types/report.ts`, `src/schemas/reportSchema.ts`: contratos e Zod.
- `src/data/reports.ts`: catálogo, mock, `buildReport`, `fetchReport`, `fetchReportCatalog` (ponto de troca pela API).
- `src/data/reportFilters.ts`, `reportMetrics.ts`: filtros padrão, cascata, URL e taxa.
- `src/components/reports/`: `ReportFiltersForm`, `ReportKpiCards`, `ReportBarChart`, `ReportStatusDonut` (SVG próprio, sem Recharts), `ReportTables`, `reportFormatters` (formatação e CSV), CSS ao lado.
- `src/pages/ReportsPage.tsx` e CSS; rota em `src/App.tsx`.
- Testes: `reports.test.ts`, `reportFormatters.test.ts`, `ReportsPage.test.tsx`; `PageHeader.test.tsx` ajustado (Relatórios deixou de ser placeholder).

## Fora do escopo
Print 2 (bloqueios, alertas, eventos → Auditoria), detalhe da campanha ao clicar na linha, API real e alteração do `CampaignStatus`.

## Validação
Lógica pura (mock, filtros, URL, CSV) conferida com os testes de `reports.test.ts` e `reportFormatters.test.ts` executados fora do vitest. **`npm run verify` e `npm run build` não foram executados**: o registro npm estava bloqueado no ambiente. Rodar ambos e fazer a revisão visual no navegador antes do push.
