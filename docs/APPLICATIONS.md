# Módulo de Aplicações Satélite

Documentação da tela de gerenciamento de aplicações satélite do Portal Campanhas.

## Visão Geral e Controle de Acesso
- **Rota:** `/aplicacoes`
- **Permissão:** Exclusiva para perfil `admin`. Analistas e gestores não visualizam o item na Sidebar nem possuem permissão de acesso à rota (`ProtectedRoute allowedRoles={['admin']}`).
- **Objetivo:** Permitir que administradores cadastrem e gerenciem aplicações satélite (PDV, totens, e-commerce) associadas a uma rede específica.

## Regras de Negócio Implementadas
1. **Listagem por Rede:**
   - Permite alternar entre as redes disponíveis (ex.: Rede Centro-Sul, Rede Nordeste, Rede Digital).
   - Apresenta: Nome da aplicação, Client ID, Escopos autorizados e Status (Ativa / Inativa).
   - Controle "Exibir apenas aplicações ativas" (marcado por padrão). Ao inativar uma aplicação, ela deixa de ser ativa e é automaticamente removida da lista de ativas.
2. **Criação de Aplicação:**
   - Formulário com: Nome, Client ID, Rede e seleção dos três escopos (`voucher:redeem`, `voucher:read`, `campaign:read`).
   - Ao salvar, exibe o segredo de cliente uma única vez com ação de copiar para a área de transferência.
   - Alerta explícito de que o segredo não será exibido de novo.
3. **Inativação:**
   - Ação protegida por modal de confirmação.
   - Retira a aplicação da lista de ativas.
4. **Rotação de Segredo:**
   - Ação protegida por modal de confirmação.
   - Gera um novo segredo e o exibe uma única vez com ação de copiar.
   - Alerta que o segredo anterior parou de valer para emissão de novos tokens.
5. **Segredos Antigos:**
   - A listagem e o detalhe nunca armazenam ou mostram segredos antigos.
6. **Integração com Token:**
   - O portal **NÃO** chama `POST /satellite/token`. Essa rota é de uso exclusivo de aplicações satélite clientes (PDV ou e-commerce) fora do portal.
