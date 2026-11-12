# Especificacao Tecnica: US-017 - Nome na sessao

> Status: In Progress
> Historia de Usuario Relacionada: US-017 (sessao na API) e US-02.5 (nome no perfil)
> Responsavel: Danilo Araujo
> Data: 2026-11-09

---

## 1. Contexto & Regras de Negocio

- O portal deixa de copiar o e-mail para o nome exibido. `POST /api/v1/auth/login` devolve `profile.name`, e a sessao guarda esse valor em `AuthUser.name`.
- A Home continua usando a primeira palavra do nome ("Ola, Ana!"). A Sidebar continua mostrando o nome inteiro. Nao ha mudanca de layout.
- Quem ja esta logado precisa entrar de novo: a sessao antiga no `localStorage` segue com o e-mail no campo `name`.
- Sem sessao, os testes isolados continuam com o usuario de `data/currentUser.ts` (Lucas Silva).

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export interface UserProfile {
  userId: string
  email: string
  name: string
  role: UserRole
  networkId: string | null
}
```

`isUserProfile` exige `name` string. `toAuthUser` usa `profile.name`.

---

## 3. Integração com a API Backend

- Endpoint: `POST /api/v1/auth/login`
- O corpo de sucesso ganha `profile.name`. `token`, `expiresIn` e `message` nao mudam.
- 401 continua "E-mail ou senha invalidos."
- O mock MSW devolve o mesmo campo. Nomes do mock: Beatriz Analista, Bruno Costa e Carlos Administrador.

---

## 4. Checklist de Implementação

- [x] 1. `name` em `UserProfile`, no guard e em `toAuthUser`
- [x] 2. `profile.name` no handler MSW e nome do gestor
- [x] 3. Teste do servico de login espera o nome do mock
- [x] 4. `npm run verify`

---

## 5. Casos de Teste Essenciais

- [x] Login do analista de mock grava `user.name` igual a "Beatriz Analista", nao o e-mail.
- [ ] Resposta de login sem `profile.name` nao passa no guard.
- [x] Credenciais invalidas continuam em erro.
