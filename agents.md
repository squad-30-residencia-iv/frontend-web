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
- **Organização de Componentes:**
  - Manter páginas em `src/pages/` e componentes React em arquivos `.tsx`.
  - Organizar componentes exclusivos por tela/funcionalidade em `src/components/<funcionalidade>/`, com pastas em minúsculas: `login`, `campaigns`, `vouchers`, `reports`.
  - Reservar `src/components/shared/` para componentes realmente usados por várias telas. Antes de criar um componente, verificar se já existe um compartilhado adequado; mover para `shared` apenas quando houver reutilização real, sem duplicar componentes.
  - Manter o CSS junto ao componente correspondente e atualizar todos os imports ao mover arquivos. Aplicar esta organização nas próximas telas e refatorações.

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

- Usar classes CSS semânticas em kebab-case no JSX, com estilos em arquivos CSS ao lado da página ou componente e importados por ele. Este é o padrão para novas telas e refatorações.
- Prefixar estilos de página com seu domínio: `.login-page`, `.login-card`, `.campaign-header`, `.voucher-card`. Componentes compartilhados usam seu próprio nome: `.brand-icon`, `.campaign-illustration`.
- Usar modificadores explícitos quando necessário, como `.login-label--password`. Evitar nomes genéricos, estilos inline e listas de utilitários Tailwind no JSX.
- Organizar o CSS por estrutura, elementos, estados (`:hover`, `:focus`, `:focus-visible`, `:active`, `:empty`) e media queries. Preservar acessibilidade, valores visuais e breakpoints nas refatorações.
- Manter em `src/styles.css` apenas estilos globais, reset e tema existentes. Estilos de componentes compartilhados não devem depender de seletores de uma página.
- Manter fidelidade aos contratos e protótipos de interface.
