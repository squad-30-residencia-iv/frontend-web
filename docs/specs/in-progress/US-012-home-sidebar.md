# Especificação Técnica: US-012 - Home (Visão Geral) com Sidebar Global

> Status: In Progress
> História de Usuário Relacionada: Home/Visão Geral com Sidebar Global (Squad 1)
> Responsável: Vitor Pádua
> Data: 2026-10-18
> Branch: `feat/03-pagina_home`
> Rastreabilidade SDD: repositório `frontend-web`. A história cita `docs/specs/backlog/spec-home-sidebar.md`, que não existe em `main` (backlog só tem `.gitkeep`); esta spec a substitui. O ID `US-012` segue a sequência do repositório e deve ser confirmado com o Squad 2.

---

## 1. Contexto & Regras de Negócio

**História:** como usuário autenticado do portal, quero acessar a tela inicial (Home/Visão Geral) com a Sidebar Global e o conteúdo de campanhas com cabeçalho de boas-vindas próprio, para visualizar o painel inicial e navegar pela estrutura base do sistema.

### O que o sistema deve fazer

- **Sidebar Global fixa** (já existente em `PortalLayout`, agora com navegação real): Visão geral (ativo por padrão na Home), Campanhas, Vouchers, Relatórios e Auditoria, com o perfil do usuário logado na parte inferior.
- **Navegação:** clicar em um item atualiza a URL (`/home`, `/campanhas`, `/vouchers`, `/relatorios`, `/auditoria`) sem recarregar a página, usando `navigate()` existente. Cliques com Ctrl/Cmd/Shift/Alt ou botão do meio mantêm o comportamento nativo do link.
- **Páginas de destino inexistentes** (`/vouchers`, `/relatorios`, `/auditoria`) renderizam um estado temporário ("Em construção") dentro do mesmo layout, com o item correto ativo.
- **Cabeçalho exclusivo da Home:** "Olá, [Nome]!" com foto de perfil e subtítulo de boas-vindas. **Não usa** o `PageHeader` genérico (breadcrumb + botão de ação), reservado às páginas internas (outra User Story).
- **Conteúdo:** banner "DESTAQUE DA SEMANA", pílulas de filtro por categoria e grid de cards de campanhas, com dados de um mock isolado (troca futura pela API sem reescrever componentes).
- **Filtro por categoria:** "Todas" por padrão; selecionar uma categoria mostra só as campanhas dela.

### Estados obrigatórios de tela

| Estado | Comportamento |
|---|---|
| Carregando | Cabeçalho de saudação já visível; `Loading` no lugar do conteúdo. |
| Sucesso | Banner, pílulas e grid. |
| Vazio | Categoria sem campanhas: `EmptyState` com ação "Ver todas as campanhas". |
| Erro | Falha ao carregar: `EmptyState` com mensagem amigável e ação "Tentar novamente". |

### O que o sistema não deve fazer

- Não renderizar `PageHeader`, breadcrumb "Portal > ..." nem botão de ação no topo da Home.
- Não criar roteador, backend, dependências ou estilos globais novos.
- Não implementar as telas de Vouchers, Relatórios e Auditoria (apenas o estado temporário).

### Rotas

| Rota | Conteúdo |
|---|---|
| `/home` | Home (nova) |
| `/` | **Continua no Login.** A autenticação (US-011, branch `feat/01_autenticacao-login`) ainda não está em `main`; quando entrar, `/` e `/home` passam a ser rotas protegidas apontando para `HomePage`. |
| `/campanhas`, `/campanhas/nova` | Inalteradas |
| `/vouchers`, `/relatorios`, `/auditoria` | Estado temporário |

### Decisões adotadas

| # | Decisão | Escolha |
|---|---|---|
| D1 | Nome do usuário | Mock único `currentUser` (`src/data/currentUser.ts`) usado pela Sidebar e pela Home; substituir por `useAuth()` quando a US-011 entrar. |
| D2 | Foto de perfil | `UserAvatar` compartilhado: usa `avatarUrl` quando existir; sem foto, ícone de usuário (visual atual da Sidebar). |
| D3 | Item ativo da Sidebar | Prop explícita `activeSection` em `PortalLayout` (com fallback pelo pathname). |
| D4 | Sair de formulário com alterações | `PortalLayout` ganha `onNavigate`; a tela de criação de campanha o usa para confirmar o descarte antes de qualquer destino da Sidebar (antes só "Campanhas" era interceptada). |
| D5 | CTA do banner | Leva a `/campanhas` até existir página de detalhe. |
| D6 | Textos do subtítulo, banner e categorias | Provisórios, no tom das demais telas; não há frame da Home no Figma. Trocar quando o time definir os textos. |
| D7 | Referência visual | Não existe frame da Home no Figma. O visual segue as telas Gerenciamento de Campanhas, Consulta de Vouchers e Relatórios (cards brancos com borda e sombra leve, chips de ícone, chips de status, botão vermelho). |
| D8 | Itens da Sidebar | Os cinco da história. O Figma mostra também "Produtos e categorias" e "Estrutura organizacional"; ficam para quando essas telas forem implementadas. |
| D9 | Base do código | `main`. As branches `feat/01_autenticacao-login`, `feat/01_ui-componentes-base-feedbacks` e `feat/02-criacao_campanhas` são idênticas ou anteriores à `main`; o login real (US-011) não está implementado em nenhuma delas. |

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
// src/types/user.ts
export interface PortalUser {
  name: string
  role: string
  avatarUrl?: string
}

// src/types/home.ts
import type { Campaign } from './campaign'

export interface HomeCategory { id: string; label: string }

export interface FeaturedCampaign {
  id: string
  title: string
  description: string
  benefit: string
  start: string // ISO yyyy-mm-dd
  end: string   // ISO yyyy-mm-dd
  ctaLabel: string
  ctaPath: string
}

export interface HomeCampaign
  extends Pick<Campaign, 'id' | 'name' | 'start' | 'end' | 'status' | 'vouchers' | 'usage'> {
  description: string
  categoryId: string
  benefit: string
}

export interface HomeOverview {
  featured: FeaturedCampaign
  categories: HomeCategory[]
  campaigns: HomeCampaign[]
}
```

---

## 3. Integração com a API Backend

Fora do escopo desta etapa. `fetchHomeOverview(): Promise<HomeOverview>` (`src/data/homeOverview.ts`) devolve o mock e é o único ponto a trocar pela chamada HTTP. A `HomePage` recebe `loadOverview` por prop (testes e integração futura). Contrato do endpoint **a definir com o backend**.

---

## 4. Checklist de Implementação

- [x] 1. Criar interfaces TypeScript (`types/user.ts`, `types/home.ts`) e mock (`data/currentUser.ts`, `data/homeOverview.ts`)
- [x] 2. `UserAvatar` compartilhado e `PortalLayout` com navegação real (`activeSection`, `onNavigate`)
- [x] 3. Componentes da Home em `components/home/` (saudação, banner, filtro, card) com CSS ao lado
- [x] 4. `HomePage` com estados carregando/sucesso/vazio/erro e `SectionPlaceholderPage`
- [x] 5. Rotas em `App.tsx` e adaptação de `CreateCampaignPage`/`CampaignManagementPage`
- [x] 6. Testes: `HomePage.test.tsx` e `App.test.tsx`
- [ ] 7. Rodar `npm run verify` e `npm run build` (pendente: o ambiente da sessão não tinha acesso ao registro npm)
- [x] 8. Ícones de categoria nos cards e subtítulo no tom das outras telas (prévia estática revisada em 1440 px e 390 px)
- [ ] 9. Revisão visual no navegador com `npm run dev` (pendente: depende de instalar as dependências)

---

## 5. Casos de Teste Essenciais

- [x] Home autenticada em `/home`: Sidebar à esquerda e título "Olá, Lucas!" no topo do conteúdo.
- [x] Clicar em "Auditoria" na Sidebar atualiza a URL para `/auditoria` e mostra o estado temporário.
- [x] A Home não contém o `PageHeader` (sem navegação "Caminho" nem botão de ação no topo).
- [x] Item "Visão geral" ativo (`aria-current="page"`) e perfil do usuário no rodapé da Sidebar.
- [x] Filtro por categoria mostra só as campanhas da categoria; "Todas" restaura.
- [x] Categoria sem campanhas mostra o estado vazio e permite voltar a "Todas".
- [x] Falha no carregamento mostra erro com "Tentar novamente" e recupera ao repetir.
- [x] Sair da criação de campanha com alterações pela Sidebar pede confirmação antes de ir ao destino escolhido.
