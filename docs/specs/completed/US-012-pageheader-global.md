# US-012 — PageHeader global (issue #12)

Criar componente compartilhado com breadcrumb configurável, título e slot opcional de ação. Aplicar à listagem/criação de campanhas e páginas provisórias de Auditoria, Vouchers e Relatórios. Preservar confirmação de saída do wizard e comportamento de links modificados. Home mantém HomeGreeting; login sem PageHeader. Sem inventar exportação de histórico para Auditoria ainda provisória.

- [x] Componente tipado, semântico e responsivo
- [x] Integração e remoção de estilos duplicados
- [x] Testes com ação, sem ação, breadcrumbs e isolamento da Home
- [x] Verify, build e documentação

Validação: npm run verify aprovado (108 testes em 8 arquivos), npm run build aprovado. Testes do PageHeader repetidos após ajuste da simulação JSDOM: 7 aprovados sem aviso de navegação. Sem commit/push.

