# Especificacao Tecnica: US-030 - Grupos de clientes e campanha em lote

> Status: Completed
> Historia de Usuario Relacionada: GH-072
> Responsavel: @squad-2
> Data: 2026-11-23

---

## 1. Contexto & Regras de Negocio

O administrador cadastra grupos de CPF por rede. O analista escolhe um ou mais grupos na campanha em lote. A união × quantidade por cliente não pode passar do teto. Esta entrega não emite voucher.

- Tela `/grupos` só do administrador: escolhe a rede, cria, inativa e cola CPFs.
- Assistente substitui os grupos A/B/C quando há rede na sessão. Sem rede (testes), o catálogo demonstrativo continua.
- Sem grupo, o lote não grava na API. Com grupos e teto suficiente, `PUT /customer-groups`.
- Texto: início é quando a emissão futura acontece; validade em dias é o prazo de uso; o fim da campanha não encerra o voucher.

---

## 2. Contratos

- `GET /api/v1/customer-groups?networkId=&activeOnly=true`
- `POST /api/v1/customer-groups` `{ networkId, name }`
- `PUT /api/v1/customer-groups/{id}/members` `{ documents }`
- `DELETE /api/v1/customer-groups/{id}`
- `POST /api/v1/customer-groups/preview` `{ networkId, groupIds }` → `{ uniqueCustomerCount }`
- `PUT /api/v1/campaigns/{id}/customer-groups` `{ groupIds }`

---

## 3. Checklist

- [x] Serviço e MSW
- [x] Tela do administrador
- [x] Assistente grava os grupos e avisa o teto
- [x] `npm run verify`
