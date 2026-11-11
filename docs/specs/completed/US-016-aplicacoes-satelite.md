# US-016 — Gerenciamento de Aplicações Satélite

Implementar módulo exclusivo para Administradores de gerenciamento de aplicações satélite vinculadas às redes de varejo.

## Requisitos & Regras de Negócio
1. **Acesso Restrito:**
   - Exclusivo para perfil `admin`. Analistas e gestores não têm acesso nem veem o link na Sidebar.
   - Rota protegida `/aplicacoes` com `<ProtectedRoute allowedRoles={['admin']}>`.
2. **Listagem:**
   - Seletor de rede para visualizar as aplicações da rede escolhida.
   - Lista exibe: Nome, Client ID, Escopos e Status (Ativa).
   - Inativação remove a aplicação da listagem de ativas após confirmação.
   - Lista e detalhe nunca armazenam ou exibem segredos antigos.
3. **Criação de Aplicação:**
   - Formulário com: Nome, Client ID, Rede e seleção dos três escopos (`voucher:redeem`, `voucher:read`, `campaign:read`).
   - Ao salvar, exibe o segredo gerado em modal único com botão de cópia e aviso de que ele não será exibido novamente.
4. **Rotação de Segredo:**
   - Ação protegida por confirmação modal.
   - Exibe o novo segredo gerado uma única vez com botão de cópia e aviso de que o segredo anterior parou de valer para tokens novos.
5. **Integração:**
   - O portal NÃO consome nem chama a rota `POST /satellite/token` (exclusiva de PDV / e-commerce).

## Checklist
- [x] Tipagem (`src/types/satellite.ts`) e mocks/serviço (`src/data/satellite.ts`, `src/services/satellite.ts`, MSW handlers)
- [x] Navegação e controle de perfil na Sidebar e `ProtectedRoute`
- [x] Componentes de formulário, modais de segredo, confirmação e tabela
- [x] Página principal `ApplicationsPage.tsx` e estilo `ApplicationsPage.css`
- [x] Registro de rota `/aplicacoes` em `App.tsx`
- [x] Testes unitários e de integração (`PortalLayout.test.tsx`, `App.test.tsx`, `satellite.test.ts`, `SecretRevealModal.test.tsx`, `ApplicationsTable.test.tsx`, `ApplicationsPage.test.tsx`)
- [x] Documentação em `docs/APPLICATIONS.md` e atualização de `docs/PROJECT_STATE.md`
