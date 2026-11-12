# 6. Critérios de aceitação

Os cenários abaixo usam a estrutura **Dado / Quando / Então**. Eles orientam testes funcionais; valores ainda pendentes não devem ser inventados para reprovar ou aprovar a implementação.

## Autenticação e contas

- **CA-001 (RF-001, RF-002):** Dado um usuário com conta ativa e credenciais válidas, quando realizar login, então o sistema deve autenticar e abrir a aplicação.
- **CA-002 (RF-002):** Dada uma conta desativada, quando o usuário tentar entrar, então o sistema deve negar o acesso.
- **CA-003 (RF-003):** Dadas tentativas consecutivas de senha incorreta, quando o limite configurado for atingido, então o sistema deve aplicar bloqueio temporário. O limite e a duração devem estar previamente definidos pela equipe.
- **CA-004 (RF-004):** Dada uma sessão sem atividade, quando o tempo de expiração configurado for atingido, então o sistema deve encerrar a sessão.
- **CA-005 (RF-006, RF-007):** Dado um Administrador de TI autorizado, quando cadastrar funcionário com nome, e-mail e senha inicial válidos, então a conta deve ser criada; se o e-mail já existir, o cadastro deve ser recusado.
- **CA-006 (RF-008, RF-012):** Dada uma conta de funcionário, quando o administrador a desativar, então o funcionário não poderá entrar ou iniciar/receber novas mensagens e o histórico anterior deverá permanecer.
- **CA-007 (RF-009, RF-010):** Dado um funcionário, quando tentar redefinir ou alterar sua senha por autoatendimento, então a operação não deverá estar disponível; um administrador autorizado poderá executar a redefinição.
- **CA-008 (RF-011):** Dado um Administrador de TI comum, quando tentar criar outro administrador ou alterar estado de conta administrativa, então o sistema deverá bloquear e registrar a tentativa.

## Diretório, perfil e conversas

- **CA-009 (RF-013 a RF-015):** Dado o diretório, quando for aberto ou pesquisado, então somente funcionários ativos deverão aparecer e os resultados deverão ser ordenados alfabeticamente.
- **CA-010 (RF-016 a RF-018):** Dado o perfil de funcionário, quando visualizado, então deverá mostrar nome completo e foto ou iniciais; o funcionário poderá alterar somente a própria foto, enquanto a alteração de nome será restrita à TI autorizada.
- **CA-011 (RF-019, RF-020):** Dado dois funcionários ativos, quando um iniciar conversa com o outro, então o sistema deverá permitir conversa privada sem exigir autorização prévia.
- **CA-012 (RF-021):** Dada uma conversa inexistente, quando a primeira mensagem for enviada, então a conversa deverá ser criada e aparecer para ambos os participantes.
- **CA-013 (RF-022 a RF-028):** Dada uma conversa com mensagens, quando o histórico for exibido, então mensagens deverão estar em ordem cronológica crescente, enviadas à direita, recebidas à esquerda, com datas DD/MM/AAAA e horários HH:MM.
- **CA-014 (RF-023):** Dado um histórico extenso, quando o usuário rolar para cima, então mensagens antigas deverão ser carregadas progressivamente.
- **CA-015 (RF-029, RF-030):** Dada uma mensagem enviada, quando qualquer perfil tentar editá-la ou excluí-la pelo aplicativo, então a operação não deverá existir/ser permitida e o histórico deverá ser preservado.
- **CA-016 (RF-031, RF-032):** Dada a interface de conversa, então não deverá exibir presença online/offline/ausente nem busca textual no corpo das mensagens.
- **CA-017 (RF-033):** Dada uma conversa com mensagens não lidas, quando exibida na lista, então deverá apresentar indicador visual sem contador numérico.
- **CA-018 (RF-034 a RF-036):** Dado destinatário conectado, quando a mensagem for disponibilizada, então o remetente deverá receber confirmação de entrega; quando o destinatário visualizar a conversa, deverá haver confirmação de leitura.
- **CA-019 (RF-036):** Dado destinatário desconectado, quando uma mensagem for enviada, então ela deverá permanecer pendente e ser disponibilizada automaticamente após a reconexão.

## Anexos e notificações

- **CA-020 (RF-037 a RF-041):** Dado um arquivo PDF ou JPEG de até 10 MB, quando enviado como único anexo da operação, então o sistema deverá aceitá-lo.
- **CA-021 (RF-041):** Dado arquivo de formato não permitido ou maior que 10 MB, quando o usuário tentar enviá-lo, então o sistema deverá bloquear o envio e informar claramente o motivo.
- **CA-022 (RF-040):** Dado um arquivo válido, quando enviado sem texto acompanhante, então o sistema deverá permitir o envio.
- **CA-023 (RF-042, RF-043):** Dado um anexo armazenado, quando um usuário tentar excluí-lo, então a operação deverá ser negada; administrador só poderá consultar seu conteúdo integral se possuir permissão especial.
- **CA-024 (RF-044 a RF-047):** Dada uma nova mensagem, quando o destinatário receber o evento, então deverá haver notificação interna e, com permissão do navegador, notificação do navegador, sem texto da mensagem e com identificação do remetente.

## Administração e auditoria

- **CA-025 (RF-048 a RF-050):** Dado o Administrador Principal, quando conceder ou revogar permissões especiais, então deverá poder gerenciar separadamente permissão de conteúdo e permissão de logs.
- **CA-026 (RF-051, RF-052):** Dada uma ação administrativa ou consulta especial, quando ocorrer, então o sistema deverá gerar registro com ator, ação, data/hora e descrição pertinente.
- **CA-027 (RF-053):** Dado um usuário sem autorização, quando tentar acessar função ou dado restrito, então o acesso deverá ser bloqueado e a tentativa registrada.
- **CA-028 (RF-054):** Dado um registro de auditoria, quando qualquer administrador tentar editá-lo ou excluí-lo pelo aplicativo, então a operação deverá ser impedida.
- **CA-029 (RF-055, RF-056):** Dado administrador sem permissão especial correspondente, quando tentar consultar conteúdo integral ou logs, então o sistema deverá bloquear o acesso; com a permissão correspondente ativa, deverá permitir e registrar a consulta.
- **CA-030 (RF-057):** Dada uma substituição do Administrador Principal formalmente designada pelo RIAS, quando o procedimento institucional for executado, então a nomeação deverá ficar documentada e rastreável.

## Critérios não funcionais e de liberação

- **CA-031 (RNF-001, RNF-002):** Antes da liberação, a equipe deverá demonstrar proteção criptográfica em trânsito e em repouso conforme arquitetura aprovada.
- **CA-032 (RNF-009 a RNF-013):** A versão inicial deverá ser validada no Google Chrome, em desktop, utilizando Vercel Online e Supabase Online conforme configuração aprovada.
- **CA-033 (RNF-018 a RNF-022):** Testes de desempenho, disponibilidade, capacidade e recuperação somente poderão ser considerados aprovados após definição prévia de metas mensuráveis.
- **CA-034 (RNF-023, RNF-024):** A política de retenção e os procedimentos de auditoria/divulgação de dados não deverão ser considerados prontos para produção sem validação jurídica e de privacidade.
