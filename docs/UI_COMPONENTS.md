# Componentes base e feedbacks

## Aplicação

Execute `npm run dev`. A entrada da aplicação é o login em `/`.

## Organização

Componentes em `src/components/ui/`, exports nomeados, imports diretos, CSS semântico adjacente quando necessário. Tailwind e HeroUI continuam configurados globalmente; nenhum estilo global ou arquivo do login foi alterado. Nenhuma dependência foi adicionada.

## Uso

```tsx
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useFeedback } from '../components/ui/useFeedback'

const feedback = useFeedback()

<Button startIcon={Plus} onPress={() => feedback.success({
  title: 'Campanha criada',
  description: 'Os dados foram salvos.',
})}>Criar</Button>

<Input label="Nome" isRequired value={name} onChange={setName}
  description="Nome exibido na campanha" errorMessage={error} />

<Select label="Status" options={[
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
]} value={status} onChange={setStatus} placeholder="Selecione" />
```

- `Button` aceita as props oficiais, incluindo ref, render function, variant, isDisabled e isPending. Ícones: startIcon/endIcon recebem um componente Lucide. Botões com isIconOnly devem receber aria-label. Variante padrão: primary. Loading usa o pending nativo e Spinner.
- `Input` usa props de TextField (onChange recebe string). Props nativas específicas do input, eventos DOM e ref podem ser enviados por inputProps. label obrigatório; icon, placeholder, description e errorMessage opcionais. Erro informado ativa isInvalid por padrão.
- `Select` é de seleção única, com options tipadas (value/label strings), value/defaultValue, onChange, disabledKeys, isDisabled, isRequired e validação nativos.
- `Modal` é controlado por isOpen/onOpenChange; recebe title, children, footer e primaryAction/secondaryAction (`label` + props de Button). A tela decide o efeito das ações e quando fechar. Fechamento por Escape, botão e backdrop é delegado à HeroUI. Pode desabilitar dismiss externo/por teclado.
- `ConfirmationModal` recebe action (`delete`, `activate`, `deactivate`), itemName, onConfirm e controle de abertura. Começa com foco em Cancelar. Não executa operações nem fecha ao confirmar: a tela controla sucesso/erro. isPending bloqueia repetição e fechamento durante a operação.
- `Loading`: mensagem opcional e role status. `EmptyState`: icon, title, description e action opcionais, exceto title.
- `FeedbackAlert`: type, title e description; permanece na tela enquanto montado. Erros/avisos usam role alert; demais usam status.
- `useFeedback`: success/error/warning/info recebem `{ title, description?, timeout? }` e retornam a chave do toast. `dismiss(chave)` fecha a notificação. Timeout 0 mantém a notificação aberta.

## Decisões da HeroUI 3.2.6

APIs verificadas nos arquivos instalados: Button usa variant/isPending; Input compõe TextField/Label/Description/FieldError; Select usa Trigger/Value/Popover/ListBox; modal controlado usa Backdrop/Container/Dialog, sem DialogTrigger artificial.

FeedbackProvider monta Toast.Provider como irmão da aplicação: esse provider representa a região de toasts, não um Context para envolver páginas. Usa a fila oficial compartilhada, sem Context ou estado duplicado. `error` adapta para toast.danger, `info` para toast.info; Alert usa status danger/accent respectivamente. Ícones Lucide são passados pelo indicator oficial.

## Validação

`npm run build`, `npm test -- --run` e `npm run verify`. Não há script de lint configurado. Testes usam Vitest, Testing Library e user-event existentes, sem mocks dos componentes HeroUI. Apenas matchMedia e ResizeObserver são simulados localmente na suíte por ausência no jsdom.

Resultado em 2026-10-10: todos os comandos aprovados, 16 testes passando (14 novos e 2 do login).

## Arquivos desta entrega

- Criados em `src/components/ui/`: Button.tsx, Input.tsx e Input.css, Select.tsx, Modal.tsx, ConfirmationModal.tsx, Loading.tsx e Loading.css, EmptyState.tsx e EmptyState.css, feedback.ts, useFeedback.tsx, FeedbackProvider.tsx, FeedbackAlert.tsx e Components.test.tsx.
- Criados para documentação: este guia e docs/specs/completed/US-002-ui-feedbacks.md.
- Modificados: src/main.tsx (provider) e docs/PROJECT_STATE.md (memória da entrega).
- A vitrine isolada (`ui.html`, `src/ui-demo.tsx` e `src/pages/ComponentsDemoPage.tsx`) foi removida. O build volta a ter só `index.html`.
