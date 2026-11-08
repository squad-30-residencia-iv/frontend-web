# Especificacao Tecnica: US-017 - Sessao no contrato real da API

> Status: Completed
> Historia de Usuario Relacionada: US-02.5 (login do portal contra a API)
> Responsavel: Danilo Araujo
> Data: 2026-11-08

---

## 1. Contexto & Regras de Negocio

- O login chama `POST /api/v1/auth/login` no endereço de `VITE_API_BASE_URL`. Com `VITE_USE_MOCK=false`, a resposta vem da API. Os testes continuam no MSW, com o mesmo corpo.
- O portal e a API ficam em origens diferentes. O token continua no `localStorage` e sai no cabeçalho `Authorization`.
- A sessão guarda `id` (`profile.userId`), `email`, `role`, `networkId` (`null` para o administrador) e usa o e-mail como nome exibido.
- Papéis da sessão: `analista`, `gestor` e `administrador`. A Home e a Sidebar mostram Analista de Campanhas, Gestor e Administrador.
- Sair apaga a sessão local e volta ao login. Não há `POST /auth/logout` nem `GET /auth/me`.
- Credencial inválida continua mostrando "E-mail ou senha inválidos.".
- Campanhas, vouchers, relatórios e auditoria permanecem nos dados locais.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export type UserRole = 'analista' | 'gestor' | 'administrador'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  networkId: string | null
}

export interface LoginResponse {
  token: string
  expiresIn: number
  message: string
  profile: {
    userId: string
    email: string
    role: UserRole
    networkId: string | null
  }
}
```

---

## 3. Integração com a API Backend

- Endpoint consumido: `POST /api/v1/auth/login`
- Corpo: `{ email, password }`
- 200: `token`, `expiresIn`, `message`, `profile`
- 401: `ProblemDetails` com `code` `AUTH_INVALID_CREDENTIALS` e `detail`; a tela mostra a frase fixa de credencial inválida
- 400: `ProblemDetails` com `detail`
- Falha de rede ou corpo fora do contrato: mensagem genérica

---

## 4. Checklist de Implementação

- [x] 1. Tipos e validação do corpo real; tradução para `AuthUser`
- [x] 2. Login no `AuthContext` com o token traduzido; logout só local
- [x] 3. MSW devolve o corpo real e deixa de responder `me` e `logout`
- [x] 4. Rótulos de analista, gestor e administrador
- [x] 5. `.env.example` documenta `VITE_API_BASE_URL`
- [x] 6. `npm run verify` e login no navegador entre `localhost:5173` e `:5026`

---

## 5. Casos de Teste Essenciais

- [x] Login válido grava o token e o perfil traduzido.
- [x] Senha errada mostra "E-mail ou senha inválidos.".
- [x] Gestor autenticado aparece como Gestor.
- [x] Sair limpa o `localStorage` sem chamar a API.
