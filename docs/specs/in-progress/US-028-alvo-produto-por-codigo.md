# Especificacao Tecnica: US-028 - Alvo de produto por codigo

> Status: In Progress
> Historia de Usuario Relacionada: GH-068 / pedido do cliente (lista de codigos de produto do satelite)
> Responsavel: Danilo Araujo
> Data: 2026-11-23

---

## 1. Contexto & Regras de Negocio

- No assistente, categoria continua no seletor multiplo (`categoryId`).
- No modo Produto, o analista usa o seletor (atalho) e um campo de textos com codigos do catalogo (colar lista: uma linha, virgula ou ponto e virgula). Os codigos sao os mesmos do satelite/PDV.
- A API ja aceite `productCode` ou `productId` (nunca os dois no mesmo alvo), ate 1.000 alvos. O portal passa a enviar codigo quando a origem for o campo de texto.
- Uniao: se o produto selecionado tem o mesmo codigo (sem diferenciar maiusculas) que um item colado, envia uma vez como `productCode`.
- Codigos precisam existir e estar ativos no catalogo. Importacao `POST /products/import` fica fora desta entrega.
- Estados: validacao no avancar (vazio / acima de 1.000); sucesso no save; erro 422 com `codes` junto ao campo e no toast.

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export const MaxCampaignItems = 1000

// benefits do CampaignDraft
productCodes: string // texto do textarea

export function parseProductCodes(text: string): string[]
```

`CatalogOption` ganha `code?: string` para unir seletor e lista.

## 3. Integracao com a API Backend

- Endpoint: `PUT /api/v1/campaigns/{id}/items`
- Corpo Product do seletor: `{ targetType: "Product", productId, productCode omitido, benefitType, benefitValue }`
- Corpo Product da lista: `{ targetType: "Product", productCode, productId omitido ou null, benefitType, benefitValue }`
- 200: `items[].productCode` na campanha
- 422 `CAMPAIGN_ITEM_PRODUCT_CODE_NOT_FOUND` / `CAMPAIGN_ITEM_PRODUCT_INACTIVE` com `codes`
- 400 se os dois identificadores no mesmo item ou mais de 1.000

## 4. Checklist de Implementacao

- [ ] 1. Spec
- [ ] 2. Tipos, parse, validacao (pelo menos um id ou codigo; teto 1.000)
- [ ] 3. Textarea no modo Produto; seletor permanece
- [ ] 4. `itemBody` uniao; reabrir `productCode` + ids do catalogo
- [ ] 5. `codes` no ProblemDetails / tela
- [ ] 6. Revisao lista códigos
- [ ] 7. Testes e `npm run verify`
- [ ] 8. PROJECT_STATE e tarefas futuras fora deste ponto

## 5. Casos de Teste Essenciais

- [ ] Parse: quebra de linha, virgula, `;`, trim, unicidade case-insensitive
- [ ] Produto so com seletor avanca; so com codigos avanca; sem nenhum recusa
- [ ] Mais de 1.000 apos uniao recusa
- [ ] Save envia `productCode` sem `productId` nos colados; overlap vira so codigo
- [ ] Reabrir preenche `productCodes` a partir de `productCode`
- [ ] 422 com `codes` aparece na mensagem
