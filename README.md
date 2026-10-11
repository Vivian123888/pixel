# PIXEL Hub

Plataforma de trabalho do grupo PIXEL. Esta primeira entrega inclui login por credenciais, dashboard, projetos, tarefas, pessoas e calendário, com PostgreSQL persistente.

## Requisitos

- Node.js 22 ou superior
- PostgreSQL
- Uma chave aleatória para AUTH_SECRET

## Desenvolvimento local

1. Copie `.env.example` para `.env.local` e preencha `DATABASE_URL`, `AUTH_SECRET` e `PIXEL_SIGNUP_CODE` com um código longo que só será compartilhado com a equipe.
2. Instale dependências: `npm install`.
3. Aplique as migrations: `npm run db:migrate`.
4. Inicie: `npm run dev` e abra `/register` para criar a primeira conta com o código compartilhado. Use uma senha de 12 a 72 caracteres.

Na Vercel, configure `DATABASE_URL`, `AUTH_SECRET` e `PIXEL_SIGNUP_CODE` em Production e Preview. Defina um código compartilhado forte e divulgue-o apenas à equipe. O build aplica migrations idempotentes do controle de acesso e do histórico. `/setup` redireciona ao cadastro com código; não existe conta administrativa privilegiada.

## Núcleo operacional

- Visão geral com atividade, projetos, tarefas e agenda.
- Cadastro e edição de projetos por qualquer integrante autenticado.
- Cadastro, organização e conclusão de tarefas.
- Cadastro de integrantes protegido por código compartilhado e diretório interno de pessoas.
- Histórico das alterações, com responsável, horário e campos modificados.
- Calendário de reuniões, prazos, eventos e treinamentos.

## Próximas fases

Governança, pesquisa, extensão, produtos, PIXEL Sports, notificações, aprovações, gestão de arquivos, gamificação, recuperação de senha e testes E2E ainda não foram implementados.

Os códigos internos de cobertura funcional são mantidos fora da navegação comum.
