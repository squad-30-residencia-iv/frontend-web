# Especificação Técnica: US-003 - Autenticação com JWT, MSW e rotas protegidas

> Status: In Progress
> História de Usuário Relacionada: Autenticação com JWT (Esquadrão 1)
> Responsável: bergue-vitor
> Data: 2026-10-13
> Branch: `feat/01_autenticacao-login`
> Rastreabilidade: substitui `docs/specs/backlog/spec-auth-msw-jwt.md` (mover/remover o rascunho do backlog, se existir)

---

## 1. Contexto & Regras de Negócio

**História:** como analista de campanhas ou administrador, quero me autenticar no portal com e-mail e senha para receber um token JWT e acessar rotas protegidas de acordo com o meu escopo de atuação.

Esta spec define o comportamento de envio do login e **substitui** o trecho da `US-001` que dizia "autenticação ainda não conectada, sem simular sessão".

### O que o sistema deve fazer

- O login chama `POST /api/v1/auth/login`. Em desenvolvimento com `VITE_USE_MOCK=true`, a chamada é interceptada pelo MSW, que simula o contrato.
- O token JWT recebido (MSW ou backend real) é salvo no `localStorage` e anexado como `Authorization: Bearer <token>` em toda requisição privada, por um único interceptor em `src/services/api.ts`.
- Rota privada sem token, ou com token expirado ou malformado, redireciona imediatamente para `/login`.
- Trocar o mock pelo backend real exige só `.env` (`VITE_USE_MOCK=false` e, para outro endereço, `VITE_API_BASE_URL`), sem alterar componentes React.
- O escopo do usuário (`role` + `organizationId`) vem na resposta do login e fica disponível em `useAuth()`. O mecanismo `allowedRoles` do `ProtectedRoute` está implementado e testado.

### O que o sistema não deve fazer

- Não enviar o token na própria chamada de login nem enviar token expirado.
- Não revelar se o e-mail existe: credencial inválida tem sempre a mesma mensagem.
- Não incluir o MSW nem as credenciais do mock no bundle de produção. O mock só carrega com `import.meta.env.DEV` **e** `VITE_USE_MOCK === 'true'`.
- Não versionar `.env` (só o `.env.example`).

### Rotas

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/login` | Pública (autenticado é enviado ao destino) | Tela de login |
| `/campanhas` | Privada | Placeholder dentro do `PrivateLayout` |
| `/cadastros` | Privada | Placeholder dentro do `PrivateLayout` |
| `*` | - | Redireciona para `/campanhas` (e daí para `/login` se não houver sessão) |

Após o login, o usuário vai para a página que tentou abrir (`state.from`) ou, se não houver, para `/campanhas`.

### Validação do formulário (antes de chamar a API)

| Campo | Regra | Mensagem |
|---|---|---|
| E-mail | Obrigatório (espaços nas pontas ignorados) | `Informe seu e-mail.` |
| E-mail | Formato `texto@dominio.ext` | `Informe um e-mail válido.` |
| Senha | Obrigatória (sem `trim`) | `Informe sua senha.` |

O formulário usa `noValidate` e `validationBehavior="aria"` para exibir as mensagens em português pelo `Input`. Erros limpam ao digitar. O foco vai para o primeiro campo inválido. Nenhuma regra de tamanho de senha foi inventada.

### Estados da tela de login

- **Carregando:** botão com `isPending`, campos somente leitura, envio duplicado bloqueado.
- **Erro:** `FeedbackAlert type="error"` — 401: `E-mail ou senha inválidos.`; 400/422: mensagem devolvida pela API; falha de rede, 5xx ou resposta fora do contrato: `Não foi possível entrar agora.`
- **Sucesso:** redirecionamento (não há mensagem de sucesso).

### Decisões adotadas

| # | Decisão | Escolha |
|---|---|---|
| D1 | Cliente HTTP | Axios (interceptors nativos) |
| D2 | Versões | `react-router` 7.18.x (Node ≥20), `axios` 1.20.x, `msw` 2.15.x como devDependency (Node ≥18). Mantêm o mínimo de Node do projeto. `react-router` 8 e `msw` 3 exigem Node ≥22.22 e ≥22.12; avaliar em spec própria. |
| D3 | Contrato da API | Proposto na seção 3. **Confirmar com o backend.** |
| D4 | Matriz de permissões por perfil | Não definida pelo produto: nenhuma restrição aplicada nas rotas reais. |
| D5 | Logout | `POST /api/v1/auth/logout`, 204. A sessão local é limpa antes, e falha do servidor não impede a saída. |
| D6 | Endereço do backend | `VITE_API_BASE_URL` (vazio = mesma origem) |
| D7 | Armazenamento do token | `localStorage`, como pede a história. Risco conhecido: exposição a XSS. |

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

- [ ] 0. Dependências (`react-router`, `axios`, `msw`), `.gitignore`, `.env.example`, `src/vite-env.d.ts` e `public/mockServiceWorker.js`
- [ ] 1. Tipos e type guards (`src/services/auth.types.ts`)
- [ ] 2. `src/services/tokenStorage.ts` (guardar, ler, limpar, decodificar JWT, checar expiração)
- [ ] 3. `src/services/api.ts` (instância Axios + interceptores de Bearer e de 401)
- [ ] 4. `src/services/auth.ts` (login, logout, me) e `src/services/loginValidation.ts`
- [ ] 5. Mock em `src/mocks/` (handlers, JWT simulado, `browser`, `server`, `enableMocking`)
- [ ] 6. `src/contexts/AuthContext.tsx` e `useAuth.ts` (restauração da sessão, login, logout)
- [ ] 7. `ProtectedRoute.tsx`, `AppRoutes.tsx`, `PrivateLayout.tsx` (botão "Sair") e páginas placeholder
- [ ] 8. `LoginPage` integrada ao `useAuth`; `main.tsx` aguarda o mock antes de renderizar
- [ ] 9. Testes de serviços, mock, contexto, rotas e login
- [ ] 10. `npm run verify` e `npm run build` aprovados
- [ ] 11. Documentação e memória atualizadas (`save-session`)

---

## 5. Casos de Teste Essenciais

**Critérios de aceite da história**

- [ ] **CA1:** com MSW ativo, o login válido grava o token, guarda o perfil e redireciona (`LoginPage.test.tsx`).
- [ ] **CA2:** sem token, `/campanhas` e `/cadastros` redirecionam para `/login` (`AppRoutes.test.tsx`).
- [ ] **CA3:** "Sair" remove o token, encerra a sessão no mock e leva a `/login` (`AppRoutes.test.tsx`, `AuthContext.test.tsx`).
- [ ] **CA4:** o mock recusa requisição privada sem `Bearer` válido (`mocks/handlers/auth.test.ts`).

**Cenários adicionais cobertos:** credencial inválida e usuário inexistente com a mesma mensagem; 422, 500, falha de rede e resposta fora do contrato; carregamento sem envio duplicado; volta para a página de origem; token expirado, malformado e adulterado; token válido sem usuário guardado; 401 do servidor encerra a sessão; `allowedRoles`; interceptor não anexa token no login nem token expirado; `enableMocking` não liga fora de DEV nem com `VITE_USE_MOCK` diferente de `true`; `localStorage` indisponível.


---

## 6. Fora de Escopo e Pendências

- Refresh token, "esqueci a senha", cadastro de usuários, matriz final de permissões, cookies `httpOnly`, conteúdo real de `/campanhas` e `/cadastros`.
- **Contraste:** o texto de erro dos campos (12 px, `#d42b2b` sobre o cartão `#d9d9d9`) mede 3,56:1, abaixo dos 4,5:1 do WCAG AA. A correção é de tema (cor `danger` para texto) e afeta todos os campos.
- **Hospedagem:** em produção, o servidor precisa devolver `index.html` para rotas como `/login` e `/campanhas` (SPA fallback).
- `public/mockServiceWorker.js` é copiado para `dist/` (arquivo inerte sem o registro do worker); pode ser excluído do deploy.