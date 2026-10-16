# Conformidade EP-01 / issue #10

## Implementado
- Schemas Zod por etapa exportados por `src/schemas/campaignSchema.ts`, com composição do schema completo. Reutilizam as regras de domínio e os nomes dos campos para manter mensagens e foco acessíveis.
- Vigência: fim estritamente posterior ao início; percentual entre 1 e 100 inclusive; quantidades inteiras positivas.
- Ativação explícita na revisão, condicionada à revalidação de todas as etapas.
- Repositório mockado separado das páginas: armazena configuração completa no navegador, inclui campanha ativa na listagem após retorno/recarga, atualiza indicadores e preserva os 80 mocks originais.
- Vouchers emitidos inicia em zero: limite configurado não é quantidade já emitida.
- Falha de escrita mantém formulário e restaura rascunho; registros corrompidos não são sobrescritos.

## Alinhamento dos critérios
As cinco etapas seguem os protótipos solicitados: Informações, Alvos e benefícios, Regras e público, Escopo e canais, Revisão. A distribuição em quatro passos descrita na issue deve ser atualizada para refletir os protótipos aprovados. Todos os campos exigidos estão distribuídos nessas etapas. Público disponível é Todos os clientes; novos segmentos dependem de definição de catálogo/contrato.

## Limites
Persistência local demonstrativa, sem API e sem compartilhamento entre navegadores. Ativar é uma ação explícita; datas permanecem configuradas pelo usuário. Histórico percentual dos indicadores e referência do filtro de período continuam demonstrativos. React Hook Form não é necessário ao critério de Zod: os inputs controlados existentes foram mantidos.

## Validação
Build de produção aprovado. Testes cobrem limites, estruturas inválidas, ativação, inclusão na listagem, recuperação de falha e preservação dos dados. Sem commit/push.
