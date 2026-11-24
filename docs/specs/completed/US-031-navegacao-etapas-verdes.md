# Especificacao Tecnica: US-031 - Navegacao pelas etapas verdes do assistente

> Status: Completed
> Historia de Usuario Relacionada: navegacao pelo resumo
> Responsavel: @squad-2
> Data: 2026-11-23

---

## 1. Contexto & Regras de Negocio

No assistente, o stepper marca as etapas ja passadas com check, mas nao e clicavel. A revisao nao leva de volta a etapa. So o botao Voltar muda de tela.

- Etapa ja passada (`index + 1 < step`) vira botao e abre aquela etapa, sem validar.
- A etapa atual e as futuras nao sao botao.
- Cada cartao da revisao tem Editar para a etapa correspondente.
- Voltar continua decrementando uma etapa.
- Depois do salto, o titulo da etapa recebe o foco, como no Continuar.

---

## 2. Contratos de Dados (Interfaces TypeScript / Schemas)

```typescript
type CampaignWizardStep = 1 | 2 | 3 | 4 | 5

interface CampaignReviewSection {
  title: string
  step: 1 | 2 | 3 | 4
  fields: CampaignReviewField[]
}
```

Mapa: Informacoes → 1, Alvo e beneficios → 2, Regras e publico → 3, Escopo e canais → 4.

---

## 3. Integracao com a API Backend

Nao ha chamada HTTP. So navegacao no rascunho em memoria.

---

## 4. Checklist de Implementacao

- [x] Stepper clicavel nas etapas verdes
- [x] Revisao com bloco de escopo e Editar
- [x] Testes e `npm run verify`

---

## 5. Casos de Teste Essenciais

- [x] Na revisao, Informacoes no stepper abre a etapa 1; Revisao nao e botao
- [x] Na etapa 2, Informacoes e botao e Alvos nao e
- [x] Editar Escopo e canais abre os checkboxes de rede
- [x] Voltar da revisao ainda abre o escopo
