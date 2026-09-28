# Especificação Técnica: US-001 — Login Portal Campanhas

> Status: In Progress
> Responsável: Lavínia Mota
> Data: 2026-09-27
> Autorização: usuário solicitou criar a base existente e, em seguida, a tela.

## 1. Contexto e regras

Inicializar React, TypeScript estrito, Vite e Tailwind CSS preservando a documentação existente. Não existem componentes, assets ou rotas reutilizáveis. Tela na entrada da aplicação, sem dependência de roteador para uma única página.

Reproduzir a referência: viewport inteira, painel esquerdo escuro com marca, chamada e ilustração de campanhas; painel direito rosa claro com cantos arredondados e formulário cinza centralizado. Vermelho como destaque. Em celulares, empilhar apresentação compacta e formulário sem rolagem horizontal.

Campos com labels, autocomplete e validação de e-mail e senha obrigatórios. Ilustração decorativa em SVG local. Foco de teclado visível. Sem endpoint informado: envio válido informa que a autenticação ainda não está conectada, sem simular sessão ou armazenar credenciais.

## 2. Contratos

`LoginCredentials`: email e password como strings. Componentes funcionais: App, LoginPage, CampaignIllustration e Brand. Estado local de feedback do formulário. Sem hooks ou serviços HTTP desnecessários.

## 3. Integração

Backend fora de escopo por ausência de contrato. Estados de carregamento e sucesso de autenticação não se aplicam nesta entrega visual. Campos vazios ou inválidos usam validação nativa; envio válido apresenta feedback acessível.

## 4. Checklist

- [ ] Configurar Vite, React, TypeScript e Tailwind.
- [ ] Implementar componentes, ilustração e layout responsivo.
- [ ] Implementar formulário acessível e feedback honesto sobre integração.
- [ ] Testar renderização e envio sem backend.
- [ ] Executar npm run verify e npm run build.
- [ ] Atualizar documentação e estado do projeto.

## 5. Validação

Verificar campos e rótulos acessíveis, senha oculta, validação obrigatória e feedback após envio válido. Revisar apresentação desktop e mobile quando houver navegador disponível.
