# 🤖 Project Agent Guide (agents.md) - Frontend

Este documento define as instruções universais para assistentes de Inteligência Artificial (Cursor, GitHub Copilot, Claude, ChatGPT, etc.) que atuarem neste repositório.

---

## 🏛️ 1. Contexto e Diretrizes Arquiteturais

- **Tecnologia Principal:** React, TypeScript, Tailwind CSS.
- **Metodologia:** Spec-Driven Development (SDD).
- **Premissa Central:** Nenhum componente, hook ou integração deve ser gerado sem uma especificação prévia aprovada em `docs/specs/in-progress/`.
- **Determinismo Técnico:** Todo o código submetido tem de compilar sem erros de tipos e passar na suíte de validação (`npm run verify`).
- **Padrões de Código:**
  - Tipagem estrita com TypeScript (evitar o uso de `any`).
  - Componentes funcionais limpos, isolados e reutilizáveis.
  - Validações de esquemas de dados em tempo de execução quando aplicável.

---

## 🔄 2. Ciclo Operacional SDD

Qualquer assistente que iniciar uma sessão deve seguir este fluxo:

1. **Início da Sessão (`resume-session`):**
   - Ler `docs/PROJECT_STATE.md` para verificar pendências.
   - Criar a especificação em `docs/specs/in-progress/US-[ID]-[nome].md`.
   - **Proibição:** Não implementar código de produção nesta etapa; foque-se na modelação de tipos e no checklist.

2. **Implementação da Spec (`implement-spec`):**
   - Seguir a ordem: Tipos/Interfaces $\rightarrow$ Componentes Visuais $\rightarrow$ Hooks/Integrações $\rightarrow$ Testes.
   - Executar o comando de validação (`npm run verify`).

3. **Fechamento e Memória (`save-session`):**
   - Mover o ficheiro para `docs/specs/completed/`.
   - Atualizar `docs/PROJECT_STATE.md`.
   - Propor mensagem semântica de commit (ex.: `feat(ui): ...`).

---

## 🧰 3. Catálogo de Skills (Área Extensível)

### [Skill] Validação Técnica e Testes

- Para verificar integridade antes de qualquer push:
  ```bash
  npm run verify
  ```

### [Skill] Padrão de Estilização e Componentes

- Uso exclusivo de utilitários Tailwind CSS.
- Manter fidelidade aos contratos e protótipos de interface.
