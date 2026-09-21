## 🛠️ Guia de Desenvolvimento: Fluxo de Trabalho e SDD

Este repositório adota a metodologia **Spec-Driven Development (SDD)** combinada com governança assistida por IA. O objetivo é assegurar componentização previsível, fidelidade aos contratos de interface, validação estrita com TypeScript e cobertura de testes antes de subir alterações.

---

### 1. Setup Inicial Obrigatório (Configuração de Hooks)

Por questões de segurança nativas do Git, as automações locais de integridade não são ativadas sozinhas após o clone.

Após clonar o repositório, instale as dependências e ative os hooks executando no terminal:

```bash
npm install
npm run prepare
```

> **Nota:** Caso o comando `npm run prepare` não configure os hooks automaticamente, execute manualmente:
> ```bash
> git config core.hooksPath scripts/hooks
> ```
> O hook de `pre-push` impede envios remotos se a validação técnica (`npm run verify`) falhar ou se o relatório de memória (`docs/PROJECT_STATE.md`) não tiver sido atualizado.

---

### 2. Entendendo o Ciclo de Vida do SDD

Nenhum componente de tela, hook customizado ou integração com API deve ser criado sem uma especificação prévia. O ciclo de trabalho é composto por três etapas obrigatórias:

1. **Início (`resume-session`):** A IA ou o desenvolvedor lê o estado atual do projeto (`docs/PROJECT_STATE.md`), analisa as pendências da sprint e cria uma especificação técnica em `docs/specs/in-progress/US-[ID]-[nome].md` baseada no template oficial.
2. **Implementação (`implement-spec`):** O código é desenvolvido seguindo o checklist da spec: Interfaces/Tipos TypeScript -> Componentes visuais/estilos -> Hooks/Integrações de API -> Testes unitários/integração.
3. **Fechamento (`save-session`):** Após validação completa via `npm run verify`, a especificação é movida para `docs/specs/completed/`, o arquivo `docs/PROJECT_STATE.md` é atualizado e uma mensagem de commit semântico é sugerida.

---

### 3. Como Operar o Fluxo no Seu Editor

#### Opção A: Para quem usa o Cursor (Recomendado)

O Cursor já possui regras automáticas configuradas em `.cursor/rules/`. Basta utilizar o chat da IDE (`Ctrl + L` ou `Cmd + L`):

1. **Para iniciar uma tarefa:**
   ```text
   @resume-session.md Quero implementar a história [ID-US] com o objetivo de [descrever brevemente a tela/componente].
   ```
2. **Para implementar o código:**
   Com a spec aprovada em `docs/specs/in-progress/`, envie:
   ```text
   @implement-spec.md
   ```
3. **Para encerrar e consolidar a memória:**
   Após a suíte de validação passar localmente, envie:
   ```text
   @save-session.md
   ```

---

#### Opção B: Para quem usa VS Code ou Outros Editores / Assistentes de IA

Se você utiliza VS Code puro, WebStorm ou assistentes externos (Claude Web, ChatGPT, Copilot):

1. **Início da Sessão:**
   - Abra `docs/prompts/resume-session.md`.
   - Copie o conteúdo e envie ao assistente de IA junto com o conteúdo de `docs/PROJECT_STATE.md`.
   - Solicite a criação da especificação técnica baseada em `docs/specs/templates/spec-template.md`.
   - Salve o arquivo gerado em `docs/specs/in-progress/US-[ID]-[nome].md`.

2. **Implementação:**
   - Abra `docs/prompts/implement-spec.md` e forneça a spec ativa ao assistente.
   - Desenvolva o código respeitando a tipagem forte do TypeScript e os padrões de UI do projeto.
   - Execute o determinismo técnico no terminal:
     ```bash
     npm run verify
     ```
   - Só prossiga se o comando retornar zero erros de tipagem, linter e testes.

3. **Fechamento da Sessão:**
   - Abra `docs/prompts/save-session.md`.
   - Mova a especificação de `docs/specs/in-progress/` para `docs/specs/completed/` e altere o cabeçalho para `Status: Completed`.
   - Abra `docs/PROJECT_STATE.md`, insira a entrega na seção **Últimas Entregas Concluídas** e marque os itens correspondentes em **Tarefas em Andamento**.
   - Faça o commit semântico e envie:
     ```bash
     git add .
     git commit -m "feat(ui): implementa componentes e tipos da US-[ID]"
     git push origin [sua-branch]
     ```

---

### ⚠️ Regras de Ouro e Boas Práticas

* **Determinismo Obrigatório:** O comando `npm run verify` deve sempre rodar com sucesso antes de solicitar code review ou tentar o push.
* **Quebras de Linha (`LF`):** Todos os scripts executáveis em `scripts/` devem ser mantidos com finais de linha Unix (`LF`).
* **Uso Cauteloso de `--no-verify`:** A trava do Git existe para evitar que branches principais quebrem o pipeline de CI/CD. Não pule validações sem justificativa explícita alinhada com a liderança técnica.