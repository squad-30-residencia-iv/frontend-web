# Operação: Salvar Sessão (Save Session)

Você deve preparar o encerramento da sessão atual de desenvolvimento:

1. Analise o progresso realizado na spec ativa em `docs/specs/in-progress/`.
2. Certifique-se de que a validação técnica (`npm run verify`) foi executada com sucesso.
3. Se foram criadas novas convenções de interface, componentes utilitários globais ou rotinas reutilizáveis, documente-as na seção de Skills do arquivo `agents.md`.
4. Atualize o arquivo `docs/PROJECT_STATE.md`:
   - Atualize a seção "Tarefas em Andamento".
   - Se a funcionalidade foi finalizada e os testes passaram, registre em "Últimas Entregas Concluídas".
5. Sugira uma mensagem de commit semântico clara (ex: `feat(ui): adiciona componente de tabela`).
6. Se a spec foi 100% concluída, instrua o desenvolvedor a movê-la para `docs/specs/completed/`.
