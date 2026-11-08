# Lembretes do calendário no Teams

O PIXEL Hub envia uma requisição POST em cada novo evento para a URL configurada em PIXEL_TEAMS_FLOW_URL. O corpo contém o título, tipo, data e horário de São Paulo, nome de quem criou e link do calendário.

## Criar o fluxo no Teams / Power Automate

1. No canal **Geral** da equipe **PIXEL**, abra o menu de reticências do canal e selecione **Workflows**.
2. Escolha o modelo **Send webhook alerts to a channel** (ou **Enviar alertas de webhook para um canal**).
3. Confirme a equipe PIXEL e o canal Geral, crie o fluxo e copie a URL de webhook fornecida.
4. Na Vercel, adicione PIXEL_TEAMS_FLOW_URL com essa URL em **Production** e **Preview** e faça um deployment.

O modelo de webhook aceita um POST JSON com uma propriedade text e publica a mensagem no canal escolhido. O app tem timeout de 5 segundos e registra o evento normalmente mesmo se o Power Automate estiver indisponível.

Documentação oficial: [Criar webhook de entrada com Workflows no Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook).

