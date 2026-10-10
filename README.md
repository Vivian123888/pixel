# PIXEL Hub

Plataforma de trabalho do grupo PIXEL. Esta primeira entrega inclui login por credenciais, dashboard, projetos, tarefas, pessoas e calendário, com PostgreSQL persistente.

## Requisitos

- Node.js 22 ou superior
- PostgreSQL
- Uma chave aleatória para AUTH_SECRET

## Desenvolvimento local

1. Copie `.env.example` para `.env.local` e preencha `DATABASE_URL` e `AUTH_SECRET`.
2. Instale dependências: `npm install`.
3. Aplique as migrations: `npm run db:migrate`.
4. Para desenvolvimento local, crie a primeira conta administrativa com `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME` e `SEED_ADMIN_PASSWORD`, então rode `npm run db:seed`. A senha precisa ter de 12 a 72 caracteres; não há senha padrão.
5. Inicie: `npm run dev`.

O seed não altera contas já existentes. Na produção, configure `PIXEL_ADMIN_EMAIL`, `PIXEL_ADMIN_SETUP_TOKEN` e `AUTH_SECRET` na Vercel. O build aplica a migration idempotente de atribuições antes de publicar a aplicação. Depois, acesse `/setup` e ative a conta administrativa. O token temporário deve ser removido da Vercel depois da ativação. A administradora cria convites de sete dias e as pessoas escolhem suas próprias senhas. Convites precisam ser encaminhados pela própria administração.

## Núcleo operacional

- Visão geral com atividade, projetos, tarefas e agenda.
- Cadastro, edição de projetos e atribuição de integrantes com autorização conferida no servidor.
- Cadastro, organização e conclusão de tarefas.
- Convites, diretório administrativo de pessoas e controle de projetos atribuídos.
- Calendário de reuniões, prazos, eventos e treinamentos.

## Próximas fases

Governança, pesquisa, extensão, produtos, PIXEL Sports, notificações, aprovações, gestão de arquivos, gamificação, recuperação de senha e testes E2E ainda não foram implementados.

Os códigos internos de cobertura funcional são mantidos fora da navegação comum.
