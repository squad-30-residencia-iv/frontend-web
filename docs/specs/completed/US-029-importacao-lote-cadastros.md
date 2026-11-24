# Especificacao Tecnica: US-029 - Importacao em lote no cadastro do admin

> Status: Completed
> Historia de Usuario Relacionada: GH-066 (API ja entregue; este trabalho e so o portal)
> Responsavel: @squad-2
> Data: 2026-11-23

---

## 1. Contexto & Regras de Negocio

Em `/cadastros`, o administrador cadastra produto e loja um a um. A API ja aceita lote (`POST /api/v1/products/import` e `POST /api/v1/establishments/import`). O portal passa a colar uma lista no modal; **nao ha upload de arquivo** e **nao ha mudanca de backend**.

- **Catalogo:** com categoria ativa selecionada, a coluna de produtos tem **Importar em lote** alem de Novo produto. O lote e daquela categoria.
- **Hierarquia:** com regiao ativa, a coluna de lojas tem o mesmo botao. O lote e daquela regiao. Canais do lote (Fisico/Virtual) valem para todas as lojas, iguais ao cadastro um a um.
- Pai inativo ou nao escolhido: o botao fica desabilitado (ou oculto no idle) com o mesmo recado do Novo.
- Parse local, antes do POST: 1 a 1.000 linhas nao vazias; codigo e nome obrigatorios; codigo ate 30 (produto) ou 20 (loja); nome ate 150; codigo repetido no texto recusa.
- Separadores de linha: ` — `, ` - `, `,`, `;` ou tab. Uma linha por item: `CODIGO — Nome`.
- Sucesso 201: fecha o modal, recarrega a coluna (`refreshKey`), toast com a quantidade `created`.
- Erro: permanece no modal. 422 `PRODUCT_CODE_TAKEN` / `ESTABLISHMENT_CODE_TAKEN` com `codes` usa `ApiProblemError` (mostra os codigos). 400 de linha (`Products[i].Code`) via `problemMessage`. O lote inteiro nao grava (regra da API).
- Analista e gestor continuam com "Acesso restrito"; a pagina nao chama as rotas.

Estados: lista da coluna igual a US-022 (loading / vazio / erro / pronta). Modal: validacao local; envio pendente; recusa da API.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export const maxRegistryImportLines = 1000
export const productCodeMaxLength = 30
export const storeCodeMaxLength = 20
export const registryNameMaxLength = 150

export interface RegistryImportLine {
  code: string
  name: string
}

export type RegistryImportKind = 'product' | 'store'
```

Parse em `src/data/registryImport.ts` (nao reutilizar o parse de alvo da campanha, que so extrai codigo).

---

## 3. Integracao com a API Backend

- `POST /api/v1/products/import` — administrador (`ManageCatalog`). Corpo: `{ categoryId, products: [{ code, name }] }`.
- `POST /api/v1/establishments/import` — administrador (`ManageHierarchy`). Corpo: `{ regionId, channels, establishments: [{ code, name }] }`.
- 201: `{ created: number }`.
- 400 `VALIDATION_ERROR`: campo (`Products[i].Code`, `Channels`, …); tela mostra `problemMessage`.
- 422 `PRODUCT_CODE_TAKEN` / `ESTABLISHMENT_CODE_TAKEN` com `codes: string[]`; `toProblemError` ja concatena os codigos.
- 422 categoria/regiao inativa ou ausente: `detail` da API.
- 500: "Nao foi possivel gravar o cadastro. Tente novamente."
- Tudo ou nada: nenhum item e persistido se o lote falhar.

Servico: `importProducts` / `importStores` em `src/services/registry.ts`. Devolvem `created`.

---

## 4. Checklist de Implementacao

- [x] 1. Helper `parseRegistryImportLines` e servico HTTP
- [x] 2. `RegistryImportModal` + botao em `RegistryColumn` (produto e loja)
- [x] 3. Abrir a partir de `CatalogPanel` e `HierarchyPanel` (`onImport`)
- [x] 4. MSW dos POSTs (201, 422 com `codes`, 403 analista)
- [x] 5. Testes de parse e de pagina; `npm run verify` (40 arquivos, 396 testes)

---

## 5. Casos de Teste Essenciais

- [x] Parse: `CODIGO — Nome`, virgula, ponto e virgula, tab; recusa vazio, > 1000, codigo repetido, limites.
- [x] Cenario feliz: importar dois produtos na categoria ativa; toast; linhas na coluna; 201 no MSW.
- [x] Cenario de erro: 422 `PRODUCT_CODE_TAKEN` com `codes`; modal aberto com os codigos; lote nao gravado.
- [x] Lojas: canais obrigatorios + textarea; 201.
- [x] Pai inativo: Importar em lote desabilitado com o recado do Novo.
- [x] Analista/gestor: acesso restrito; sem chamada HTTP (ja coberto na US-022).
