# Especificação Técnica: US-011 - Autenticação com JWT, MSW e rotas protegidas

> Status: In Progress
> História de Usuário Relacionada: Autenticação com JWT (Esquadrão 1)
> Responsável: bergue-vitor
> Data: 2026-10-16
> Branch: `feat/01_autenticacao-login`
> Rastreabilidade: substitui o rascunho `docs/specs/backlog/spec-auth-msw-jwt.md` (se existir) e a primeira versão desta spec, que previa `react-router`.

---

## 1. Contexto & Regras de Negócio

**História:** como analista de campanhas ou administrador, quero me autenticar no portal com e-mail e senha para receber um token JWT e acessar rotas protegidas de acordo com o meu escopo de atuação.

Esta spec define o comportamento de envio do login e **substitui** o trecho da `US-001` que dizia "autenticação ainda não conectada, sem simular sessão".

**Navegação do projeto.** O app usa navegação própria (`src/navigation/navigate.ts` e a leitura do `pathname` em `src/App.tsx`), sem roteador. Essa decisão do time (US-003) é **mantida**: a proteção das páginas é feita por um componente `ProtectedRoute` e nenhuma biblioteca de rotas é adicionada.

### O que o sistema deve fazer

- O login chama `POST /api/v1/auth/login`. Em desenvolvimento com `VITE_USE_MOCK=true`, a chamada é interceptada pelo MSW, que simula o contrato.
- O token JWT recebido (MSW ou backend real) é salvo no `localStorage` e anexado como `Authorization: Bearer <token>` em toda requisição privada, por um único interceptor em `src/services/api.ts`.
- Página privada sem token válido (ausente, expirado ou malformado) redireciona imediatamente para `/login?from=<página>`.
- Trocar o mock pelo backend real exige só `.env` (`VITE_USE_MOCK=false` e, para outro endereço, `VITE_API_BASE_URL`), sem alterar componentes React.
- O escopo do usuário (`role` + `organizationId`) vem na resposta do login e fica disponível em `useAuth()`. O mecanismo `allowedRoles` do `ProtectedRoute` está implementado e testado.
- O `PortalLayout` mostra o usuário logado (nome e perfil) e um botão **Sair**. Renderizado sem login (telas isoladas), mantém o perfil padrão e não mostra o botão.

### O que o sistema não deve fazer

- Não enviar o token na própria chamada de login nem enviar token expirado.
- Não revelar se o e-mail existe: credencial inválida tem sempre a mesma mensagem.
- Não incluir o MSW nem as credenciais do mock no bundle de produção. O mock só carrega com `import.meta.env.DEV` **e** `VITE_USE_MOCK === 'true'`.
- Não versionar `.env` (só o `.env.example`).
- Não alterar o comportamento das telas de campanhas além de protegê-las. As mudanças em arquivos do time são aditivas (ver "Arquivos do time alterados").

### Rotas

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/login`, `/` e qualquer rota desconhecida | Pública (autenticado é enviado ao destino) | Tela de login, como hoje |
| `/campanhas` | Privada | `CampaignManagementPage` |
| `/campanhas/nova` | Privada | `CreateCampaignPage` |

Após o login, o usuário vai para a página que tentou abrir (`?from=`, aceitando só caminhos internos) ou, se não houver, para `/campanhas`. A história cita `/cadastros` como exemplo de rota privada; essa tela não existe no projeto e fica fora do escopo.

### Validação do formulário (antes de chamar a API)

| Campo | Regra | Mensagem |
|---|---|---|
| E-mail | Obrigatório (espaços nas pontas ignorados) | `Informe seu e-mail.` |
| E-mail | Formato `texto@dominio.ext` | `Informe um e-mail válido.` |
| Senha | Obrigatória (sem `trim`) | `Informe sua senha.` |

O formulário usa `noValidate` e `validationBehavior="aria"` para exibir as mensagens em português pelo `Input`. Erros limpam ao digitar. O foco vai para o primeiro campo inválido. Nenhuma regra de tamanho de senha foi inventada.

### Estados da tela de login

- **Carregando:** botão com `isPending`, campos somente leitura, envio duplicado bloqueado.
- **Erro:** `FeedbackAlert type="error"`: 401 mostra `E-mail ou senha inválidos.`; 400/422 mostram a mensagem devolvida pela API; falha de rede, 5xx ou resposta fora do contrato mostram `Não foi possível entrar agora.`
- **Sucesso:** redirecionamento (não há mensagem de sucesso).

### Arquivos do time alterados (de forma aditiva)

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | envolve as duas páginas privadas com `ProtectedRoute` |
| `src/components/layout/PortalLayout.tsx` e `.css` | mostra o usuário logado e o botão Sair; sem login, mantém o perfil padrão |
| `src/main.tsx` | liga o mock e envolve o app com `AuthProvider` |
| `src/test/setup.ts` | servidor MSW nos testes e limpeza entre testes |
| `src/pages/LoginPage.tsx` e `LoginPage.test.tsx` | login real |
| `src/pages/CreateCampaignPage.test.tsx` | abre o app com sessão e usa "Sair" para chegar ao login (5 pontos) |

`src/navigation/navigate.ts` **não é alterado**: o novo `src/navigation/replaceRoute.ts` troca a rota sem empilhar histórico.

### Decisões adotadas

| # | Decisão | Escolha |
|---|---|---|
| D1 | Cliente HTTP | Axios (interceptors nativos) |
| D2 | Dependências | `axios` 1.20.x e `msw` 2.15.x (somente desenvolvimento). **Sem `react-router`**, por decisão do time. `msw` 3 exige Node ≥22.12; avaliar em spec própria. |
| D3 | Contrato da API | Proposto na seção 3. **Confirmar com o backend.** |
| D4 | Matriz de permissões por perfil | Não definida pelo produto: nenhuma restrição aplicada nas páginas reais. |
| D5 | Logout | `POST /api/v1/auth/logout`, 204. A sessão local é limpa antes, e falha do servidor não impede a saída. |
| D6 | Endereço do backend | `VITE_API_BASE_URL` (vazio = mesma origem) |
| D7 | Armazenamento do token | `localStorage`, como pede a história. Risco conhecido: exposição a XSS. |
| D8 | Página de origem | Vai na URL (`?from=`), porque a navegação do projeto não guarda estado. `replaceRoute` evita entradas extras no histórico. |

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

Em `src/services/auth.types.ts`:

```typescript
export type UserRole = 'analyst' | 'admin'

export interface AuthUser { id: string; name: string; email: string; role: UserRole; organizationId: string }
export interface LoginCredentials { email: string; password: string }
export interface LoginResponse { accessToken: string; tokenType: 'Bearer'; expiresIn: number; user: AuthUser }
export interface ApiErrorBody { code: string; message: string }
export interface JwtPayload { sub: string; exp: number; iat?: number } // exp em segundos
```

- Type guards `isAuthUser` e `isLoginResponse` validam a resposta em tempo de execução (sem dependência extra).
- Chaves do `localStorage`: `portal:auth:token` e `portal:auth:user`, centralizadas em `src/services/tokenStorage.ts`.
- O cliente lê o `exp` do JWT apenas para decidir se o token expirou. **A assinatura não é validada no front-end**; quem valida é o servidor.

---

## 3. Integração com a API Backend

| Endpoint | Auth | Sucesso | Erros |
|---|---|---|---|
| `POST /api/v1/auth/login` `{ email, password }` | Não | 200 `LoginResponse` | 400/422 `ApiErrorBody`; 401 `INVALID_CREDENTIALS`; 5xx |
| `GET /api/v1/auth/me` | Bearer | 200 `AuthUser` | 401 `UNAUTHORIZED` |
| `POST /api/v1/auth/logout` | Bearer | 204 | 401 `UNAUTHORIZED` |

**Interceptores (`src/services/api.ts`):**

- Requisição: anexa `Authorization: Bearer <token>` quando há token válido, exceto em `/auth/login`.
- Resposta: 401 em rota privada limpa a sessão e chama o handler registrado pelo `AuthProvider`, que redireciona para `/login`. O 401 do próprio login não dispara isso.

**Mock (MSW), em `src/mocks/`:** valida o formato `Bearer`, a assinatura simulada e a expiração do token; mantém em memória os tokens encerrados pelo logout (a "sessão simulada"); responde com latência configurável (`mockConfig.latencyMs`).

| Perfil | E-mail | Senha |
|---|---|---|
| analyst | `analista@portal.dev` | `Analista@123` |
| admin | `admin@portal.dev` | `Admin@123` |

**Ambiente:** copiar `.env.example` para `.env`. `VITE_USE_MOCK=true` liga o mock em dev; `VITE_API_BASE_URL` aponta para o backend real. `.env` está no `.gitignore`.

---

## 4. Checklist de Implementação

Ordem do `agents.md`: tipos, integrações, telas e testes. Marque cada item com `[x]` ao concluir.

- [x] 0. Dependências (`axios` e `msw` em desenvolvimento), `.gitignore`, `.env.example`, `src/vite-env.d.ts` e `public/mockServiceWorker.js`; `react-router` removido (o projeto usa navegação própria)
- [x ] 1. Tipos e type guards (`src/services/auth.types.ts`)
- [x] 2. `src/services/tokenStorage.ts` (guardar, ler, limpar, decodificar JWT, checar expiração)
- [x] 3. `src/services/api.ts` (instância Axios + interceptores de Bearer e de 401)
- [x] 4. `src/services/auth.ts` (login, logout, me) e `src/services/loginValidation.ts`
- [ ] 5. Mock em `src/mocks/` (handlers, JWT simulado, `browser`, `server`, `enableMocking`)
- [ ] 6. `src/contexts/AuthContext.tsx` e `useAuth.ts` (restauração da sessão, login, logout)
- [ ] 7. `ProtectedRoute.tsx`, `src/navigation/replaceRoute.ts` e proteção das duas páginas em `src/App.tsx`
- [ ] 8. `PortalLayout` com o usuário logado e o botão "Sair"
- [ ] 9. `LoginPage` integrada ao `useAuth`; `main.tsx` aguarda o mock antes de renderizar
- [ ] 10. Testes de serviços, mock, contexto, layout, rotas e login (incluindo o ajuste do `CreateCampaignPage.test.tsx`)
- [ ] 11. `npm run verify` e `npm run build` aprovados
- [ ] 12. Documentação e memória atualizadas (`save-session`)

---

## 5. Casos de Teste Essenciais

**Critérios de aceite da história**

- [ ] **CA1:** com MSW ativo, o login válido grava o token, guarda o perfil e redireciona (`LoginPage.test.tsx`).
- [ ] **CA2:** sem token, `/campanhas` e `/campanhas/nova` redirecionam para `/login` (`App.test.tsx`).
- [ ] **CA3:** "Sair" remove o token, encerra a sessão no mock e leva a `/login` (`App.test.tsx`, `AuthContext.test.tsx`, `PortalLayout.test.tsx`).
- [ ] **CA4:** o mock recusa requisição privada sem `Bearer` válido (`mocks/handlers/auth.test.ts`).

**Cenários adicionais cobertos:** credencial inválida e usuário inexistente com a mesma mensagem; 422, 500, falha de rede e resposta fora do contrato; carregamento sem envio duplicado; volta para a página de origem e rejeição de `?from=` externo; token expirado, malformado e adulterado; token válido sem usuário guardado; 401 do servidor encerra a sessão; `allowedRoles`; interceptor não anexa token no login nem token expirado; `enableMocking` não liga fora de DEV nem com `VITE_USE_MOCK` diferente de `true`; `localStorage` indisponível; `PortalLayout` sem `AuthProvider` mantém o perfil padrão; as telas de campanhas do time seguem passando com sessão.

---

## 6. Fora de Escopo e Pendências

- Refresh token, "esqueci a senha", cadastro de usuários, matriz final de permissões, cookies `httpOnly` e a tela `/cadastros` (não existe no projeto).
- **Contraste:** o texto de erro dos campos (12 px, `#d42b2b` sobre o cartão `#d9d9d9`) mede 3,56:1, abaixo dos 4,5:1 do WCAG AA. A correção é de tema (cor `danger` para texto) e afeta todos os campos.
- **Hospedagem:** em produção, o servidor precisa devolver `index.html` para rotas como `/login` e `/campanhas` (SPA fallback).
- `public/mockServiceWorker.js` é copiado para `dist/` (arquivo inerte sem o registro do worker); pode ser excluído do deploy.
- Os contratos de `login`, `logout` e `me` são uma proposta; confirmar com o backend.