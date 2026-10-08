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
4. Crie a primeira conta administrativa: preencha temporariamente `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME` e `SEED_ADMIN_PASSWORD` com valores próprios, então rode `npm run db:seed`. A senha precisa ter de 12 a 72 caracteres; não há senha padrão.
5. Remova `SEED_ADMIN_PASSWORD` do ambiente após o bootstrap.
6. Inicie: `npm run dev`.

O seed não altera contas já existentes. Redefinição de senha e convites ainda precisam de um fluxo administrativo próprio.

## Núcleo operacional

- Visão geral com atividade, projetos, tarefas e agenda.
- Cadastro e lista de projetos.
- Cadastro, organização e conclusão de tarefas.
- Diretório de pessoas provisionadas.
- Calendário de reuniões, prazos, eventos e treinamentos.

## Próximas fases

Governança, pesquisa, extensão, produtos, PIXEL Sports, notificações, aprovações, gestão de arquivos, gamificação, recuperação de senha, convite de usuários e testes E2E ainda não foram implementados.

Os códigos internos de cobertura funcional são mantidos fora da navegação comum.
