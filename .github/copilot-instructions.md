# Diretrizes de Contexto e Governança do Repositório (GitHub Copilot)

Você deve seguir rigorosamente as regras, convenções arquiteturais e fluxos de trabalho estabelecidos neste repositório.

1. **Fonte Única de Verdade:** Sempre consulte e obedeça ao arquivo `agents.md` localizado na raiz do projeto antes de sugerir código, contratos ou refatorações.
2. **Ciclo de Desenvolvimento (SDD):**
   - Não gere código de produção sem que haja uma especificação aprovada em `docs/specs/in-progress/`.
   - Ao iniciar, implementar ou finalizar tarefas, oriente o desenvolvedor de acordo com as instruções contidas nos prompts em `docs/prompts/` (`resume-session.md`, `implement-spec.md` e `save-session.md`).
3. **Padrões Técnicos:**
   - Respeite as tipagens, arquitetura e convenções documentadas no repositório.
   - Sempre certifique-se de que testes e comandos de validação do projeto sejam cumpridos.
