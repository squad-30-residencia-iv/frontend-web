# US-005 — Alvos e benefícios

Data: 2026-10-13. Status: Completed.
Autorização: pedido anexado e imagem da segunda etapa.

## Diagnóstico/contrato
CreateCampaignPage controla um único CampaignDraft, persistido localmente; etapa 1 e layout já existem. Acrescentar benefits ao contrato e step 1|2 no mesmo componente. Sem rotas novas, sem alterar gerenciamento/login.
Campos: tipo percentual/fixo; valores alternativos e coleção Adicionar; aplicação compra inteira ou produtos/categorias; tipo e seleção múltipla local; máximo de vouchers; modo automático/lote; quantidade por concessão, limite por cliente; base de clientes, quantidade por cliente e total calculado.

## Decisões
Radios nativos acessíveis, sem wrapper equivalente. Reutilizar Button/Input/Select; generalizar Select com modo múltiplo da HeroUI 3 instalado, mantendo padrão single. Catálogo/base demonstrativos, sem API. Base 1 com 2500 clientes, total calculado por quantidade. Validar apenas campos do modo escolhido. Adicionar registra o benefício escolhido em lista compacta na mesma seção; não impor cumulatividade ou regras comerciais ausentes.
Rascunhos da etapa 1 migram preservando information e recebem defaults de benefits. Voltar entre etapas preserva todo o estado. Resumo deriva da validade de cada grupo. Etapa 3 pendente com feedback. Etapa 2 usa altura natural/rolagem do documento, sem min-height artificial ou segunda scrollbar.

## Checklist
- [x] Tipos, migração, validação, componente exclusivo e integração.
- [x] Testes de navegação/preservação, seleção, modos, validação, rascunho e regressões.
- [x] Build/test/verify, diff e documentação.

## Ajuste autorizado — 2026-10-14
Todos os inputs e seletores da segunda etapa ficam habilitados para edição, independentemente dos radios selecionados. Os radios continuam definindo o benefício/aplicação/modo usados na validação. Total previsto continua sendo saída calculada, atualizada ao editar quantidade/base. Ajuste solicitado diretamente pelo usuário; expectativas de habilitação atualizadas nos testes existentes.
