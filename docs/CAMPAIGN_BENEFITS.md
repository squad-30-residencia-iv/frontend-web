# US-005 — Alvos e benefícios: relatório

## Integração e navegação
A segunda etapa integra CreateCampaignPage no mesmo formulário e no mesmo CampaignDraft. O estado step (1|2) escolhe o conteúdo; não foi criada outra página, rota, formulário, sidebar ou cabeçalho.
Continuar da primeira etapa valida information e abre Alvos e benefícios. Voltar retorna à primeira sem apagar nenhuma seção. Indicador marca Informações concluída e Alvos e benefícios atual; foco acompanha o título. A URL permanece /campanhas/nova.
Continuar da segunda etapa valida benefits, mantém dados e mostra feedback sobre Regras e público ainda pendente. Handler pronto para conectar a terceira etapa sem conteúdo fictício.
Salvar rascunho continua persistindo localmente, agora com as duas seções. Rascunhos anteriores são migrados sem perder information; benefits recebe defaults quando ausente ou estruturalmente inválido. Reabrir inicia na primeira etapa; ao avançar, os benefícios salvos estão disponíveis.

## Campos e comportamentos
- Desconto percentual ou fixo, com valores alternativos preservados. Percentual maior que zero e até 100%; reais positivos com até duas casas decimais. Formatos decimais com ponto ou vírgula, sem separador de milhar ambíguo.
- Adicionar registra o benefício escolhido na coleção do rascunho, apresentada compactamente na mesma seção; remoção individual disponível. Nenhuma regra de cumulação de descontos foi definida ou aplicada.
- Aplicação sobre valor total da compra ou produtos/categorias específicas. Tipo Categoria/Produto e seleção múltipla. Seleção obrigatória apenas no modo específico. Mudar o tipo limpa os IDs incompatíveis.
- Quantidade máxima de vouchers inteira positiva. Quantidade por cliente indicada conforme o modo escolhido.
- Geração automática: quantidade por concessão e limite por cliente, inteiros positivos.
- Geração em lote: base de clientes obrigatória, quantidade por cliente inteira positiva, total previsto calculado (tamanho da base × quantidade).
- Os dois grupos de geração ficam visíveis como no print; todos os grupos ficam editáveis, e apenas o modo selecionado é obrigatório na validação. Radios usam fieldset/legend e navegação nativa por teclado.
- Erros junto aos campos, foco no primeiro inválido e resumo baseado na validade de cada grupo. Descarte ao sair e beforeunload existentes permanecem.

## Layout/rolagem
Mesma largura e estrutura da primeira etapa. Na segunda etapa, removida a altura mínima herdada dos cards e usado alinhamento ao topo; conteúdo determina a altura. Painéis internos não têm altura fixa nem rolagem própria. Apenas o documento rola verticalmente; nenhuma área escura/excedente do print foi reproduzida. Sidebar mantém o comportamento sticky existente. Campos empilham em telas estreitas e etapas quebram em linhas no mobile para evitar rolagem horizontal.

## Componentes e arquivos
Reutilizados PortalLayout, indicador existente, Button, Input, Select, Modal, FeedbackAlert, useFeedback/provider e Lucide. Select ganhou generic Mode (single padrão ou multiple), usando APIs instaladas da HeroUI 3, sem duplicar wrapper. Radios nativos foram usados por ausência de wrapper equivalente.
Criados:
- src/components/campaigns/create/CampaignBenefitsForm.tsx
- src/components/campaigns/create/CampaignBenefitsForm.css
- src/data/campaignBenefits.ts
- docs/specs/completed/US-005-alvos-beneficios.md
- docs/CAMPAIGN_BENEFITS.md
Modificados:
- src/types/campaign.ts
- src/data/campaignDraft.ts
- src/components/ui/Select.tsx
- src/pages/CreateCampaignPage.tsx
- src/pages/CreateCampaignPage.css
- src/pages/CreateCampaignPage.test.tsx
- docs/PROJECT_STATE.md
- docs/CREATE_CAMPAIGN.md

## Referência, interpretações e limites
Print não revela opções do catálogo/base: opções locais demonstrativas Moda, Calçados, Casa; Camiseta demonstrativa/Tênis demonstrativo; Base 1 com 2500 clientes. O valor 1 do seletor de base e o total 2.500 da imagem foram interpretados dessa forma. Nenhuma API ou persistência remota.
Campos de desconto têm labels distintos (%) e (R$) para acessibilidade; todos os campos de entrada ficam habilitados para edição. Adicionar foi interpretado como registrar o benefício no rascunho, sem pressupor regras comerciais ausentes na imagem. Voltar foi incluído conforme pedido explícito. O rótulo Continuar foi mantido conforme a imagem e a primeira etapa.
Valores iniciais: 20%, R$200,00 (alternativa), compra total, categoria, seleção vazia, máximo1000, automática, quantidades/limite1, Base1 e total previsto2500. Resumo não marca campos inválidos como completos só para reproduzir o verde do protótipo.
Revisão visual em navegador não realizada; ferramentas de navegador indisponíveis nesta sessão. Layout não foi validado pixel a pixel.

## Acesso e validação
npm run dev em frontend-web; abra /campanhas/nova na porta anunciada pelo Vite, preencha o nome da campanha e clique Continuar.
Build aprovado; aviso Vite de chunk JS acima de 500 kB.
Suíte completa e verify aprovados: 46 testes em 4 arquivos (10 novos e teste de continuidade anterior adaptado). Sem script de lint.
git status, git diff --stat e git diff --check executados. Sem dependências, backend, alterações no login/gerenciamento, commit ou push.
Sugestão de commit: feat(campaigns): integra etapa de alvos e benefícios ao rascunho.

## Atualização US-006
Continuar da segunda etapa agora abre Regras e público após validação, preservando toda a edição dos benefícios. A etapa 3 foi integrada ao mesmo estado. Relatório em [CAMPAIGN_RULES.md](CAMPAIGN_RULES.md).
