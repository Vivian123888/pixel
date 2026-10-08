# PIXEL Hub — Plano de Implementação

## Fase 0 — Auditoria e preparação
1. Versionar o código-fonte extraído do ZIP.
2. Identificar stack, scripts, rotas, banco, autenticação, integrações e deploy.
3. Executar instalação, lint, typecheck, testes e build existentes.
4. Remover segredos do histórico e configurar `.env.example`.

## Fase 1 — Fundação
- Next.js/TypeScript ou preservação do stack existente.
- Banco PostgreSQL com ORM e migrations.
- Autenticação, sessões seguras e RBAC server-side.
- Layout responsivo, navegação, estados de carregamento e erro.
- Auditoria e validação server-side.

## Fase 2 — Core operacional
- Dashboard e Meu Trabalho.
- Pessoas, projetos, tarefas e entregas.
- Calendário, notificações, arquivos, aprovações e busca.
- Histórico/auditoria e persistência real.

## Fase 3 — Módulos de negócio
- Governança.
- Pessoas e Jornada.
- Projetos e Produtos.
- Pesquisa.
- Extensão e Comunicação.
- PIXEL Sports.
- Gamificação baseada em eventos validados.

## Fase 4 — Qualidade e produção
- Testes unitários, integração e E2E.
- PWA e revisão de viewports mobile.
- Acessibilidade WCAG AA quando aplicável.
- Segurança de uploads, rate limiting, headers e logs.
- CI, documentação, healthcheck e deploy.

## Critérios de avanço
Não avançar de fase sem revisar os critérios da fase anterior. Cada fase deve terminar com lint, typecheck, testes e build executados no código-fonte real.

## Regra de produto
A interface deve orientar o usuário a tarefas reais do PIXEL. Os códigos internos de processos não devem aparecer na navegação comum ou na home.
