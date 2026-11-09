# Especificacao Tecnica: US-022 - Cadastros no portal

> Status: Completed
> Historia de Usuario Relacionada: frontend-web#42 (Cadastros no portal)
> Responsavel: Gabriel Torres
> Data: 2026-11-09

---

## 1. Contexto & Regras de Negocio

- O administrador cadastra, altera, inativa e reativa rede, região, loja, categoria e produto em `/cadastros`. A API já existe.
- Só o papel `administrador` usa a tela. O item "Cadastros" da Sidebar aparece só para ele. Analista e gestor que abrirem a URL veem "Acesso restrito" e nenhuma rota de cadastro é chamada.
- A tela tem duas abas. Hierarquia: redes → regiões da rede escolhida → lojas da região escolhida. Catálogo: categorias → produtos da categoria escolhida. Categoria e produto não têm rede.
- As listas trazem ativos e inativos, com o status visível. Ativos primeiro, depois por nome.
- Criar e editar abrem um formulário em modal. Rede pede nome e fuso IANA (padrão `America/Sao_Paulo`). Região e categoria pedem nome. Loja pede código, nome e canais Físico/Virtual (ao menos um). Produto pede código e nome.
- Limites validados na tela antes do envio: nome até 150, código de loja até 20, código de produto até 30, fuso até 64 e reconhecido pelo navegador.
- Inativar é sempre o `DELETE` e pede confirmação. A confirmação avisa a cascata: "Inativar a rede inativa as regiões e lojas dela." e "Inativar a região inativa as lojas dela." e "Inativar a categoria inativa os produtos dela.".
- O `PUT` nunca envia `isActive: false`: inativar tem um caminho só, o `DELETE` com confirmação. Editar mantém o status atual. Um cadastro inativo mostra "Reativar", que repete os dados com `isActive: true`. Reativar o pai não reativa os filhos.
- Reativar um filho com o pai inativo volta `422` (ex.: "Região informada está inativa"). A tela mostra a mensagem. Com o pai escolhido inativo, o botão de criar filho fica desabilitado e diz "Reative ... para cadastrar ...".
- Depois de qualquer gravação, as listas abertas recarregam (a cascata aparece sem trocar de aba) e um toast confirma.
- Recusa da API: a tela mostra `detail` ou, sem ele, a primeira mensagem de `errors`. No formulário, a mensagem fica dentro do modal e os dados continuam. Em inativar e reativar, vai num toast de erro.
- Estados de cada lista: aguardando a escolha do pai, carregando, vazia, com itens e erro com "Tentar novamente".

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export type StoreChannel = 'Physical' | 'Virtual'
export type RegistryEntity = 'network' | 'region' | 'store' | 'category' | 'product'

export interface RegistryNetwork { id: string; name: string; timeZone: string; isActive: boolean }
export interface RegistryRegion { id: string; networkId: string; name: string; isActive: boolean }
export interface RegistryStore { id: string; regionId: string; code: string; name: string; channels: StoreChannel[]; isActive: boolean }
export interface RegistryCategory { id: string; name: string; isActive: boolean }
export interface RegistryProduct { id: string; categoryId: string; code: string; name: string; isActive: boolean }

/** Valores do formulário. Campos que a entidade não usa ficam vazios. */
export interface RegistryFormValues { name: string; code: string; timeZone: string; channels: StoreChannel[] }
```

A leitura é defensiva, como em `services/catalog.ts`: item sem `id`, `name` ou `isActive` é descartado; corpo que não é lista gera erro.

---

## 3. Integração com a API Backend

- `GET /api/v1/networks`, `GET /api/v1/regions?networkId=`, `GET /api/v1/establishments?regionId=`, `GET /api/v1/categories`, `GET /api/v1/products?categoryId=` (sem `activeOnly`: ativos e inativos)
- `POST` em cada recurso: `{ name, timeZone }`, `{ networkId, name }`, `{ regionId, code, name, channels }`, `{ name }`, `{ categoryId, code, name }`
- `PUT /{id}`: `{ name, timeZone, isActive }`, `{ name, isActive }`, `{ code, name, isActive, channels }`, `{ name, isActive }`, `{ code, name, isActive }`
- `DELETE /{id}` → `204`, com a cascata feita pela API
- `400`: primeira mensagem de `errors`. `422`: `detail` (nome ou código repetido, pai inativo). `403` e `404`: `detail`. Falha de rede: mensagem genérica.
- O corpo do `POST` e do `PUT` não é lido: a tela recarrega a lista.

---

## 4. Checklist de Implementação

- [x] 1. Tipos e leitura defensiva das cinco listas; mensagem do ProblemDetails num helper compartilhado
- [x] 2. Item "Cadastros" na Sidebar filtrado por papel e rota `/cadastros` no `App`
- [x] 3. Tela com abas, colunas em cascata, status, criar, editar, reativar e inativar com confirmação
- [x] 4. MSW com estado para as cinco rotas (incluindo cascata, nomes repetidos, pai inativo e `403` para quem não é administrador)
- [x] 5. Testes da tela, `npm run verify` e `npm run build`, e conferência no navegador com o MSW

---

## 5. Casos de Teste Essenciais

- [x] Administrador lista redes, regiões da rede e lojas da região, com o status visível.
- [x] Cria uma rede, uma região e uma loja com os canais; a lista recarrega e o toast confirma.
- [x] Loja sem canal não é enviada.
- [x] Edita uma categoria e cria um produto nela.
- [x] Inativar a rede pede confirmação, avisa a cascata e deixa regiões e lojas inativas.
- [x] Inativar a categoria deixa os produtos inativos; reativar um produto com a categoria inativa mostra o `detail`.
- [x] Nome repetido mostra o `detail` dentro do formulário, sem fechar o modal.
- [x] Analista e gestor não veem "Cadastros" na Sidebar e, pela URL, veem "Acesso restrito" sem chamar a API.
