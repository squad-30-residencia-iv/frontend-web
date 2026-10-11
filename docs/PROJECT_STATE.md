# 🧠 Estado Atual do Frontend (Project State)

> Atualizado ao final de cada sessão de desenvolvimento.

---

## 📌 Contexto Geral

- **Sprint:** Sprint 1
- **Foco:** Componentes base e feedbacks sobre a stack React existente.
- **Última atualização:** 2026-10-10.

---

## 🚧 Tarefas em Andamento

- [ ] US-001 Login: o formulário já usa `Input`, `Button` e `FeedbackAlert`. A spec segue em `docs/specs/in-progress/` com checklist em aberto (stack, layout, testes da spec, verify/build e documentação).

---

## ✅ Últimas Entregas Concluídas

- Configuração inicial do ecossistema de SDD (prompts, templates e governança).
- US-002: Button, Input, Select, Modal, ConfirmationModal, Loading, EmptyState, FeedbackAlert e feedbacks via Toast oficial HeroUI 3.2.6.
- Documentação dos componentes em `docs/UI_COMPONENTS.md`. A vitrine `/ui.html` foi removida.
- Paleta do portal em `src/styles.css`: cores próprias no `@theme` e tokens da HeroUI apontando para a mesma paleta.
- Validação: `npm run build`, `npm test -- --run` e `npm run verify` aprovados; 16 testes. Sem script de lint.

---

## ⚠️ Bloqueios & Decisões Recentes

- Stack React + TypeScript + Vite, Tailwind, HeroUI e Lucide já instalada ao iniciar esta task.
- Preservados App, login, estilos globais e dependências. Novos componentes em `components/ui` conforme escopo solicitado, com exports nomeados e CSS semântico adjacente.
- Toast usa fila/provider oficiais; nenhum Context adicional. O app tem uma única entrada, `index.html`, e abre o login.
- A HeroUI segue a paleta do portal pelos tokens `--accent`, `--danger`, `--background`, `--foreground`, `--surface`, `--muted`, `--border`, `--success` e `--warning`. O login não força mais um vermelho local.
- `npm run verify` aprovado nesta sessão: typecheck e 16 testes.
- Spec US-001 não foi concluída; permanece em `docs/specs/in-progress/`.
- Alterações de tema prontas para commit, sem push. Sugestão: `feat(theme): padroniza a paleta do portal nos tokens da HeroUI`.
