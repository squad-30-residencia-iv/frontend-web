# PageHeader global — issue #12

`src/components/shared/PageHeader.tsx` é o cabeçalho das páginas internas. Recebe `title`, `breadcrumbs`, `action` opcional (ReactNode) e `titleId` opcional. Cada breadcrumb recebe `label`, `href` opcional e `onClick` opcional para interceptar a saída. O último item recebe aria-current e não é link. Links internos usam navigate, preservando Ctrl/Cmd/Shift/Alt. A página continua responsável por confirmar alterações não salvas.

## Uso
```tsx
<PageHeader
  title="Auditoria"
  breadcrumbs={[{ label: 'Portal' }, { label: 'Auditoria' }]}
  action={<Button onPress={handleExport}>+ Exportar histórico</Button>}
/>
```

O slot só é renderizado se houver ação. Auditoria ainda é uma página provisória: suporta o cabeçalho sem botão enquanto a funcionalidade de exportar não existe; o exemplo de ação é coberto por teste do componente. Não foi criada uma exportação fictícia.

Integrado em Campanhas, Nova campanha, Vouchers, Relatórios e Auditoria. Os nomes das páginas provisórias vêm do catálogo de navegação da rota atual. Breadcrumbs aninhados são configurados na criação. Home permanece com HomeGreeting e login sem este componente. Estilos compartilhados adjacentes, título em negrito, ação à direita e quebra responsiva, sem dependência do CSS das páginas.

Sem dependências novas, commit ou push. Verificação visual em navegador não realizada nesta sessão.
