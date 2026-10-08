# PIXEL Hub

Fundação full-stack do sistema de gestão do grupo PIXEL.

## Stack
- Next.js App Router + TypeScript strict
- Auth.js com credenciais e sessão JWT
- PostgreSQL + Drizzle ORM
- Modelo inicial para usuários, papéis, permissões, projetos, tarefas, notificações e auditoria
- GitHub Actions, Vitest e Playwright

## Configuração local
1. Instale Node.js 20.9+.
2. Copie `.env.example` para `.env.local`.
3. Defina `DATABASE_URL` para um PostgreSQL disponível e gere um `AUTH_SECRET` aleatório.
4. Execute `npm install` e `npm run dev`.

A migration inicial está em `migrations/0001_foundation.sql`; aplique-a a um banco PostgreSQL antes de utilizar as rotas autenticadas. Não há senha de administrador embutida no código. O provisionamento inicial de usuários deve ser feito com segurança antes da abertura do sistema.

## Comandos
```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
`

## Estado
Esta branch introduz a fundação e não representa, sozinha, a conclusão de todos os módulos funcionais ou uma implantação de produção. Configure as variáveis e execute a suíte de validação antes do deploy.