# Especificacao Tecnica: US-024 - Uso da campanha e aplicacoes na API

> Status: Completed
> Historia de Usuario Relacionada: issue #45 e issue #48
> Responsavel: Danilo Araujo
> Data: 2026-11-12

---

## 1. Contexto & Regras de Negocio

- O detalhe de um Guid mostra os confirmados (`issuedVouchers`) e as reservas vivas (`reservedVouchers`) que o `GET /api/v1/campaigns/{id}` já devolve. Utilizados, expirados e a lista de vouchers continuam vazios: não há rota de leitura desses itens para o portal.
- Na Home e no gerenciamento, a barra da campanha da API é a parcela do limite já confirmada ou reservada. Sem limite, a parcela fica em zero.
- `/aplicacoes` lista as redes ativas de `GET /api/v1/networks` e grava os escopos canônicos da API: `campaigns:read`, `vouchers:issue` e `vouchers:redeem`.
- Cadastros já chamam o CRUD existente e não mudam nesta entrega.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
export interface ApiCampaign {
  issuedVouchers: number
  reservedVouchers: number
}

export type SatelliteScope = 'campaigns:read' | 'vouchers:issue' | 'vouchers:redeem'
```

Número ausente ou inválido nos contadores vira zero.

---

## 3. Integração com a API Backend

- `GET /api/v1/campaigns` e `GET /api/v1/campaigns/{id}`: ler `issuedVouchers` e `reservedVouchers`.
- `GET /api/v1/networks`: opções da tela de aplicações, só as ativas.
- `GET/POST /api/v1/satellite/apps`, `PATCH /api/v1/satellite/apps/{id}/deactivate` e `POST .../rotate-secret`: os escopos enviados e exibidos são os canônicos.

---

## 4. Checklist de Implementação

- [x] 1. Ler os contadores e calcular a parcela do limite
- [x] 2. Mostrar confirmados e reservas no detalhe e a parcela na lista
- [x] 3. Redes ativas e escopos canônicos em `/aplicacoes`
- [x] 4. Testes do mapeamento, do detalhe e das aplicações
- [x] 5. `npm run verify`

---

## 5. Casos de Teste Essenciais

- [x] 40 confirmados e 10 reservas num limite de 100 viram 50% na lista e os dois números no detalhe.
- [x] Contador ausente permanece zero.
- [x] A tela de aplicações oferece os três escopos da API e carrega as redes informadas.
