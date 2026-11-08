# Especificacao Tecnica: US-019 - Rascunho, seletores e detalhe na API

> Status: Completed
> Historia de Usuario Relacionada: US-01.1, US-01.2, US-01.3, US-01.4, US-01.5, US-01.7, US-01.9 e US-01.12
> Responsavel: Danilo Araujo
> Data: 2026-11-08

---

## 1. Contexto & Regras de Negocio

- No fim do assistente, a sessão com `networkId` grava o rascunho na API. Sem sessão, os testes continuam no armazenamento do navegador.
- O administrador não tem rede: a tela avisa e não chama a API.
- A ordem é `POST /api/v1/campaigns` e, em seguida, os `PUT` de itens, quantidades, público, validade, restrições e condições. O id fica no navegador. Se um `PUT` falhar, a nova tentativa reutiliza esse id.
- Datas saem como `aaaa-mm-ddThh:mm`, sem fuso. Descrição vai nula. Início no passado volta `422` e a tela mostra a mensagem.
- "Toda a compra" vira um item `All`. Categorias ou produtos viram um item por id, com `Percentage` ou `FixedAmount`.
- A quantidade máxima é `totalVoucherLimit`. O limite por cliente é `perCustomerVoucherLimit`. No lote, esse limite é a quantidade por cliente.
- Público é `AllCustomers`. Validade é relativa em dias, sem teto. `maxUsesPerVoucher` vai `1`. A primeira faixa de compra vira mínimo e máximo. Condições de valor mínimo viram `PurchaseTotal`. `allowUseInSamePurchase` vai `false`.
- Benefício extra no mesmo alvo e condições em "qualquer" impedem o envio. Mais de uma faixa, base de clientes, quantidade por concessão e lojas e canais são avisados: a API não os grava. As lojas aparecem, mas a escolha fica no navegador.
- Categorias e produtos ativos vêm de `GET /categories` e `GET /products`. Lojas ativas vêm das regiões da rede e, para cada região, das lojas.
- O detalhe de um Guid usa `GET /api/v1/campaigns/{id}`. Uso e vouchers recentes ficam vazios. Submeter, aprovar, pausar e encerrar não aparecem. Ids locais continuam no repositório.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export interface PortalCatalog {
  categories: { value: string; label: string }[]
  products: { value: string; label: string }[]
  stores: { id: string; code: string; name: string }[]
}
```

O corpo do `POST` leva `networkId`, `name`, `description`, `startsAt` e `endsAt`. Cada `PUT` segue o contrato já publicado pela API.

---

## 3. Integração com a API Backend

- `POST /api/v1/campaigns` e `PUT /api/v1/campaigns/{id}`, `/items`, `/quantities`, `/audience`, `/voucher-validity`, `/usage-restrictions`, `/conditions`
- `GET /api/v1/categories?activeOnly=true`, `GET /api/v1/products?activeOnly=true`
- `GET /api/v1/regions?networkId=` e `GET /api/v1/establishments?regionId=`
- `GET /api/v1/campaigns/{id}`
- `400` e `422`: a tela mostra `detail` ou a primeira mensagem de campo
- Falha de rede: mensagem genérica, com o rascunho ainda na tela

---

## 4. Checklist de Implementação

- [x] 1. Tradução do rascunho para o `POST` e os `PUT`, com o id reaproveitado
- [x] 2. Seletores de categoria, produto e loja da rede da sessão
- [x] 3. Avisos do que a API não grava
- [x] 4. Detalhe do Guid sem ações de status e sem vouchers inventados
- [x] 5. MSW, `npm run verify` e um rascunho no navegador

---

## 5. Casos de Teste Essenciais

- [x] Analista grava a sequência e vê a campanha na listagem.
- [x] Falha num `PUT` não gera outro `POST`.
- [x] Benefício extra e condições em "qualquer" não são enviados.
- [x] Administrador não chama a API.
- [x] Detalhe de um Guid mostra o nome da API e não oferece pausar nem aprovar.
