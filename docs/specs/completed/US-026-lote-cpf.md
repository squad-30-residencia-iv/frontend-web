> Versão anterior, substituída pela seleção de grupos da US-027. O fluxo CSV não está mais disponível.

# US-026 — Prévia de lote por CSV de CPFs

Escopo aprovado pelo pedido de implementação frontend em 19/11/2026.

- Substituir base demonstrativa por CSV de coluna única cpf, modelo para download.
- Validar estrutura, dígitos verificadores, zeros iniciais, repetidos, arquivo vazio e falha de leitura. Limites locais: 1 MB e 10.000 linhas de clientes, sujeitos ao contrato futuro.
- Resumo e prévia mascarada de até 10 linhas; relatório de erros por linha, sem CPF integral.
- Quantidade por cliente e total calculado pelos CPFs válidos únicos; bloquear avanço sem lista íntegra ou acima do limite da campanha.
- Dados pessoais somente em memória no wizard, preservados entre etapas; limpar ao sair, recarregar ou trocar para automática. Nenhum CPF, nome de arquivo ou lista vai ao rascunho/localStorage, logs ou rede.
- Salvar rascunho guarda só configuração e avisa para reimportar. Revisão apresenta quantidade, nunca CPF. Sem envio/geração real nem endpoints fictícios; bloquear conclusão também em modo local.
- Reutilizar componentes e tema. Não alterar backend ou .env; não fazer commit/push.

Validação: parser/CPF, interface, recarga e não persistência, limite, revisão e testes existentes; npm run verify e build.

## Validação

- npm run verify passou: 374 testes em 38 arquivos.
- Depois, foram adicionados quatro casos: download, leitura concorrente, bloqueio de envio/limite e reimportação. Os 56 testes do wizard passaram; os quatro testes finais do importador passaram após corrigir a simulação de FileReader.
- npm run build executado para validar tipos e produção.
- Sem alterações em backend ou .env, sem commit/push.
