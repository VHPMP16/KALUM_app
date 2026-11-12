# 4. Regras de negócio

- **RN-001 — Público restrito:** somente funcionários da Kalunga podem possuir conta de usuário comum.
- **RN-002 — Sem cadastro público:** contas são criadas pela equipe de TI, individualmente.
- **RN-003 — Identificador único:** o e-mail corporativo deve ser único por conta.
- **RN-004 — Conta ativa:** somente funcionários com conta ativa podem entrar, iniciar conversas e receber novas mensagens.
- **RN-005 — Desativação sem apagamento:** desativar conta impede novos acessos e novas interações, mas não elimina o histórico já existente.
- **RN-006 — Diretório:** apenas funcionários ativos aparecem no diretório de contatos.
- **RN-007 — Conversa privada:** cada conversa possui exatamente dois participantes; não existem grupos.
- **RN-008 — Início de conversa:** qualquer funcionário ativo pode iniciar conversa com qualquer outro funcionário ativo.
- **RN-009 — Criação sob demanda:** a conversa é criada no envio da primeira mensagem.
- **RN-010 — Imutabilidade:** mensagens enviadas não podem ser editadas ou excluídas por nenhum perfil.
- **RN-011 — Imutabilidade de anexos:** anexos enviados não podem ser excluídos por nenhum perfil.
- **RN-012 — Retenção solicitada:** histórico e anexos devem ser preservados sem exclusão automática, inclusive após desativação de conta; aplicação operacional depende de validação legal e de privacidade.
- **RN-013 — Estados de mensagem:** o sistema distingue mensagem armazenada/enviada, entregue e lida.
- **RN-014 — Entrega:** mensagem é considerada entregue quando fica disponível ao destinatário; para destinatário desconectado, permanece pendente até reconexão.
- **RN-015 — Leitura:** mensagem é considerada lida quando o destinatário abre/visualiza a conversa.
- **RN-016 — Sem presença:** não são exibidos estados online, offline ou ausente.
- **RN-017 — Ordenação:** lista de conversas prioriza a atividade mais recente; mensagens dentro da conversa seguem ordem cronológica crescente.
- **RN-018 — Data e hora:** datas são exibidas em DD/MM/AAAA e horários em HH:MM, conforme fuso corporativo a definir.
- **RN-019 — Anexos permitidos:** somente PDF e JPEG são aceitos.
- **RN-020 — Limite de anexo:** cada arquivo pode ter no máximo 10 MB.
- **RN-021 — Envio unitário:** cada operação pode enviar apenas um arquivo.
- **RN-022 — Arquivo independente:** um anexo pode ser enviado sem texto acompanhante.
- **RN-023 — Notificação privada:** notificações não mostram o conteúdo da mensagem; devem identificar o remetente conforme texto final validado.
- **RN-024 — Perfil funcionário:** funcionário pode alterar apenas sua foto de perfil; não pode alterar o nome exibido nem a senha.
- **RN-025 — Nome exibido:** alteração do nome do funcionário é restrita à TI autorizada.
- **RN-026 — Administrador de TI:** pode administrar contas de funcionários e utilizar funcionalidades comuns de chat.
- **RN-027 — Administrador Principal:** pode administrar contas, criar/promover administradores e ativar/desativar contas administrativas.
- **RN-028 — Administrador Principal único por designação:** o Administrador Principal é provisionado/designado institucionalmente; outro administrador não pode assumir esse papel por promoção comum.
- **RN-029 — RIAS:** somente a designação institucional pelo RIAS autoriza a substituição do Administrador Principal, fora do fluxo normal do aplicativo.
- **RN-030 — Permissão de conteúdo:** consultar conteúdo integral de mensagens/anexos exige permissão especial individual.
- **RN-031 — Permissão de logs:** consultar registros administrativos exige permissão especial individual independente da permissão de conteúdo.
- **RN-032 — Concessão e revogação:** somente Administrador Principal pode conceder ou revogar as duas permissões especiais.
- **RN-033 — Registro de auditoria:** ações administrativas, consultas especiais e tentativas não autorizadas devem ser registradas.
- **RN-034 — Integridade da auditoria:** nenhum administrador pode editar ou excluir logs pelo aplicativo.
- **RN-035 — Sem modificação de conteúdo:** nem Administrador Principal nem qualquer outro administrador pode editar ou excluir mensagens/anexos.
- **RN-036 — Criptografia:** dados devem ser protegidos em trânsito e em repouso; não se exige E2EE tradicional devido à necessidade de auditoria autorizada.

## 4.1 Matriz resumida de permissões

| Ação | Funcionário | Admin. TI | Admin. Principal |
|---|---:|---:|---:|
| Usar chat | Sim | Sim | Sim |
| Criar conta de funcionário | Não | Sim | Sim |
| Ativar/desativar funcionário | Não | Sim | Sim |
| Redefinir senha de funcionário | Não | Sim | Sim |
| Alterar nome exibido | Não | TI autorizado | TI autorizado |
| Criar/promover administrador | Não | Não | Sim |
| Ativar/desativar conta administrativa | Não | Não | Sim |
| Conceder/revogar permissão especial | Não | Não | Sim |
| Consultar conteúdo integral | Não por padrão | Somente se autorizado | Somente se autorizado |
| Consultar logs administrativos | Não por padrão | Somente se autorizado | Somente se autorizado |
| Editar/excluir mensagens ou anexos | Não | Não | Não |
| Editar/excluir logs pelo app | Não | Não | Não |

**Observação:** a tabela representa as permissões de negócio aprovadas. O acesso de auditoria não decorre automaticamente do cargo de administrador; depende das permissões especiais concedidas.
