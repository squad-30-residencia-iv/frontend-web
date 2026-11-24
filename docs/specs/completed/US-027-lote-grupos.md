# US-027 — Lote por grupos de clientes

Pedido aprovado: substituir importação de CPFs pela seleção múltipla de grupos já cadastrados, mostrar grupos selecionados e permitir agregar/remover. Retirar as frases explicativas do lote.

Não há cadastro/consulta de grupos disponível no projeto local. Usar catálogo demonstrativo explícito e centralizado até contrato real, sem endpoints fictícios. Cada grupo possui IDs sintéticos de clientes; calcular união para não contar clientes presentes em dois grupos duas vezes. Não usar CPFs reais.

Manter seleção em memória entre etapas, resumo de clientes únicos, quantidade por cliente, limite e bloqueio da conclusão enquanto não houver backend. Revisão mostra nomes dos grupos. Retirar UI/parser CSV substituídos. Atualizar testes e documentação, sem backend, .env, commit ou push.

Validar seleção, remoção, agregação, limite, preservação entre etapas, revisão e bloqueio. npm run verify e build.

Concluída: npm run verify passou (376 testes em 38 arquivos), npm run build passou. Catálogo real permanece dependente do backend.
