# Especificacao Tecnica: US-013 - Relatórios e Indicadores

> Status: In Progress
> Historia de Usuario Relacionada: EP-03 (US-03.1, US-03.2, US-03.3 parcial, US-03.5)
> Responsavel: @vitor
> Data: 2026-10-27
> Nota: o ID US-013 segue o planejamento recebido; já existem specs concluídas com esse mesmo número (vouchers e detalhes da campanha).

---

## 1. Contexto & Regras de Negocio

Substitui o "Em construção" de `/relatorios` por uma página com indicadores de vouchers, filtros e exportação. Somente front-end com mock; a API entra depois (ponto único de troca: `fetchReport` e `fetchReportCatalog` em `src/data/reports.ts`).

**Tela**
- Cabeçalho (`PageHeader`): breadcrumb Portal > Relatórios, título "Relatórios e indicadores", subtítulo e botão **Exportar CSV**.
- Filtros: Período, Campanha, Categoria, Rede, Região, Estabelecimento e Tipo de cliente; botões Aplicar e Limpar filtros; chips removíveis dos filtros ativos.
- 5 KPIs: emitidos, resgatados, expirados e não utilizados, ainda disponíveis, taxa de utilização.
- Gráfico de barras mensal (emitidos/resgatados/expirados) e rosca de distribuição por status.
- Tabelas: Top 5 campanhas por utilização e Desempenho por região (com Tkt Médio mock).
- Estados: carregando, sucesso, vazio (filtros sem resultado), nenhuma campanha e erro (com "Tentar novamente").

**Decisões já tomadas (planejamento)**
1. Cancelados entram na conta: `emitidos = resgatados + expirados + disponíveis + cancelados`.
2. O Print 2 (bloqueios, alertas, eventos) vai para a tela Auditoria, com spec própria.
3. A coluna Tkt Médio entra como mock.
4. O botão Exportar CSV entra no cabeçalho.

**Regras**
- Taxa de utilização = resgatados ÷ emitidos; mostra "—" quando não há emitidos.
- Filtros combinam por AND. Filtro sem resultado é sucesso (visão zerada), não erro.
- Limpar volta ao consolidado com "Últimos 30 dias".
- Rede → Região → Estabelecimento em cascata (opções dependentes; valor incompatível é zerado).
- Filtros ficam na URL (`?periodo=&campanha=&categoria=&rede=&regiao=&estabelecimento=&cliente=`); valores inválidos são ignorados. Atualização por `replaceState`.
- Estado dividido em filtros em edição (`draft`) e aplicados (`applied`); só Aplicar, Limpar e remoção de chip disparam nova consulta.

**Decisões de implementação (a confirmar)**
- Gráficos em SVG próprio (Recharts não instalado e o registro npm estava bloqueado no ambiente de desenvolvimento desta sessão); sem dependência nova.
- Períodos do mock: Últimos 30 dias = último mês da série; 90 dias = 3 meses; 6 meses = 6 meses. A série mensal tem 6 meses fixos (Jan-Jun) e não depende de data atual.
- O gráfico mensal mostra sempre os 6 meses e respeita todos os filtros exceto Período; KPIs, rosca e tabelas respeitam o Período.
- Chips: um por filtro, como na imagem; o "x" só aparece nos que diferem do padrão.

## 2. Contratos de Dados

`src/types/report.ts` (tipos), `src/schemas/reportSchema.ts` (Zod): filtros, catálogo e resposta (`ReportData`), com validação de que emitidos = soma dos quatro status.

## 3. Integração com a API Backend

Fora do escopo. `fetchReport(filters)` e `fetchReportCatalog()` retornam Promises locais e validam a resposta com Zod, prontas para troca por HTTP.

## 4. Checklist de Implementação

- [x] 1. Branch `feat/04-pagina_relatorios` (sugerida) e esta spec
- [x] 2. Tipos e schema Zod
- [x] 3. Mock e fetchReport
- [x] 4. Utilitários de taxa, formatação e CSV
- [x] 5. Componentes visuais
- [x] 6. Página, URL e rota
- [x] 7. Testes
- [ ] 8. `npm run verify` e build (NÃO executados: sem acesso ao registro npm na sessão)
- [ ] 9. Documentação e PROJECT_STATE (feitos; mover a spec para completed após o verify)

## 5. Casos de Teste Essenciais

- [ ] KPIs padrão: 5.899 / 3.567 / 892 / 1.284 / 60,5%.
- [ ] Taxa "—" sem emitidos; filtros sem resultado mostram visão zerada.
- [ ] Cascata Rede → Região → Estabelecimento; Limpar; chips.
- [ ] URL: leitura, escrita e valores inválidos ignorados.
- [ ] Exportar CSV; estados erro/retry, carregando, nenhuma campanha.

## Fora do escopo
Print 2 (Auditoria), detalhe da campanha ao clicar na linha, API real e alteração do `CampaignStatus`.
