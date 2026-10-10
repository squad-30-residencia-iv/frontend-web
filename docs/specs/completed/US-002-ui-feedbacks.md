# Especificação Técnica: US-002 — Componentes base e feedbacks

> Status: Completed
> Responsável: Lavínia Mota
> Data: 2026-10-10
> Escopo autorizado: solicitação detalhada de continuação da task UI Componentes Base e Módulo de Feedbacks.

## Diagnóstico

Branch `feat/01_ui-componentes-base-feedbacks`, sem alterações locais ao iniciar. React + TypeScript estrito + Vite, Tailwind 4.3.3, HeroUI 3.2.6, Lucide já instalados. Exports nomeados, aspas simples, sem ponto e vírgula, CSS semântico adjacente. Apenas componentes exclusivos do login; nenhum componente base equivalente. Sem roteador. Vitest + Testing Library + jsdom, sem lint configurado. PROJECT_STATE anterior desatualizado; login e stack já existem.

## Contratos e implementação

- Componentes em `src/components/ui/`, arquivos diretos, conforme preferência explícita da task; sem mover login nem antecipar shared.
- Button estende props HeroUI, ícones Lucide e estado pending nativo. Input compõe TextField, Input, Label, Description e FieldError. Select tipado compõe Trigger, Value, Popover e ListBox. Modal controlado delega foco, teclado e fechamento à biblioteca.
- Loading, EmptyState, FeedbackAlert e ConfirmationModal para delete/activate/deactivate, sem regras de negócio internas.
- useFeedback adapta sucesso/erro/aviso/informação para toast.success/danger/warning/info, com título, descrição e ícones; provider oficial único por entrada, sem Context próprio.
- Demonstração isolada em `ui.html`, com entrada própria; App e login intactos. Build multipágina do Vite.
- Sem dependências novas, alterações no lockfile, autenticação, commit ou push.

## Validação

- [x] Componentes base e feedbacks implementados.
- [x] Demonstração de todos os estados solicitados.
- [x] Testes de interação, acessibilidade, modal, select e feedbacks.
- [x] Build, npm test -- --run e npm run verify aprovados.
- [x] Documentação de uso e memória atualizadas.

Resultado: 16 testes aprovados (14 novos e 2 existentes do login). Sem lint configurado. Arquivos do login, App, estilos globais e manifests/lockfile inalterados, verificados por git diff. Validação visual manual no navegador não realizada; demonstração pronta em /ui.html. Comandos Node precisaram rodar fora do sandbox devido a EPERM no caminho do usuário.
