# Consulta de Vouchers

Rota `/vouchers` substitui o placeholder e usa PortalLayout com seção vouchers e PageHeader sem ação primária, com subtítulo opcional adicionado de forma compatível com os usos anteriores.

## Comportamento
- Cards calculados sobre o conjunto completo carregado; filtros afetam somente a tabela e seu total.
- Busca por código, nome demonstrativo do cliente ou identificação já mascarada. Nenhum documento completo é armazenado.
- Campanha, status e últimos 30/90 dias de emissão (datas locais inclusivas, excluindo emissões futuras); todos aplicados por Filtrar ou Enter. Limpar restaura campos, resultados e primeira página.
- Sete itens por página, página atual acessível, saltos/reticências e anterior/próxima desabilitados nos extremos. Última página com cinco itens.
- Tabela com rolagem horizontal focável em telas menores e cards em duas colunas no mobile.
- Menu HeroUI acessível aponta para `/vouchers/:id/historico`. Destino tem apenas aviso provisório e retorno; não existe implementação de histórico ou movimentações.
- Carregador local Promise injetável segue padrão da Home. Loading, erro com retry, sucesso e vazio são tratados sem API, timeout ou backend fictício; efeitos descartados não atualizam tela desmontada.

## Mocks e referência
Os sete exemplos iniciais reproduzem códigos, campanhas, identificação mascarada, datas, usos e status da imagem. Registros adicionais usam códigos DEMO e nomes de cliente explicitamente demonstrativos. Os cards somam 5.899 registros (1.284 disponíveis, 3.567 utilizados, 892 expirados e 156 cancelados), total coerente com 843 páginas. O rodapé da imagem mostra 120, incompatível com os cards e a página 843; usa-se o total real do mock. Status históricos da imagem são explícitos, sem transições automáticas por relógio.

## Arquivos
- `src/types/voucher.ts`: contrato tipado.
- `src/data/vouchers.ts`: mocks, carregador e filtros puros.
- `src/components/vouchers/VoucherActionsMenu.tsx`: ações por linha.
- `src/pages/VoucherLookupPage.tsx` e CSS: tela e destino provisório.
- `src/pages/VoucherLookupPage.test.tsx`: cobertura de consulta e navegação.
- `src/App.tsx`: rotas.
- `src/components/shared/PageHeader.tsx` e CSS: subtítulo opcional.
- Testes de Home e PageHeader ajustados à substituição da página provisória.

Sem novas dependências, commit ou push. Revisão visual em navegador não realizada nesta sessão.

## Validação final
`npm run verify`: 117 testes aprovados em nove arquivos; TypeScript aprovado. `npm run build`: aprovado com os avisos já existentes de bundle e comentários da dependência Zod. Dez novos testes de vouchers cobrem rota/cabeçalho, cards, busca, filtros, datas inclusivas, vazio, erro/retry, carregamento, paginação e ações por teclado.
