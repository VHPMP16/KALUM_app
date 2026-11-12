# 2. Requisitos funcionais

Os requisitos abaixo descrevem comportamentos observáveis do sistema. O status **Aprovado** indica que a regra foi confirmada no levantamento; detalhes de implementação continuam sob responsabilidade técnica.

## 2.1 Autenticação e sessão

- **RF-001 — Login corporativo (Aprovado):** o sistema deve autenticar o usuário por e-mail corporativo e senha.
- **RF-002 — Bloqueio de conta inativa (Aprovado):** o sistema deve impedir login de contas desativadas.
- **RF-003 — Tentativas inválidas (Aprovado):** após várias tentativas consecutivas de senha incorreta, o sistema deve aplicar bloqueio temporário. Quantidade de tentativas e duração são pendentes.
- **RF-004 — Expiração por inatividade (Aprovado):** o sistema deve encerrar a sessão após período de inatividade. O período é pendente de definição técnica.
- **RF-005 — Sem segundo fator (Aprovado):** não haverá exigência de autenticação em dois fatores na versão inicialmente especificada.

## 2.2 Contas de funcionários

- **RF-006 — Criação individual (Aprovado):** Administrador de TI autorizado deve criar contas individualmente, informando nome completo, e-mail corporativo e senha inicial.
- **RF-007 — Unicidade do e-mail (Aprovado):** o sistema deve impedir duas contas com o mesmo e-mail corporativo.
- **RF-008 — Ativação e desativação (Aprovado):** Administrador de TI deve poder ativar e desativar contas de funcionários.
- **RF-009 — Redefinição de senha (Aprovado):** Administrador de TI deve poder redefinir a senha de funcionário.
- **RF-010 — Sem autoatendimento de senha (Aprovado):** o funcionário não deve alterar a própria senha nem iniciar redefinição autônoma pelo aplicativo.
- **RF-011 — Gestão de administradores (Aprovado):** somente Administrador Principal de TI pode criar/promover outros Administradores de TI e ativar/desativar contas administrativas.
- **RF-012 — Preservação de histórico (Aprovado):** desativar uma conta não deve apagar conversas ou mensagens históricas.
- **RF-013 — Diretório ativo (Aprovado):** o diretório deve apresentar somente funcionários com contas ativas.

## 2.3 Diretório e perfil

- **RF-014 — Busca de funcionários (Aprovado):** o usuário deve poder localizar funcionários ativos por nome.
- **RF-015 — Ordenação do diretório (Aprovado):** os resultados do diretório devem ser apresentados em ordem alfabética.
- **RF-016 — Perfil do funcionário (Aprovado):** o perfil deve exibir nome completo, sem exibir e-mail corporativo como informação principal.
- **RF-017 — Foto de perfil (Aprovado):** o funcionário deve poder adicionar, alterar ou remover a própria foto; na ausência de foto, o sistema deve exibir iniciais.
- **RF-018 — Alteração de nome (Aprovado):** somente TI autorizado deve alterar o nome exibido do funcionário.

## 2.4 Conversas e mensagens

- **RF-019 — Conversa individual (Aprovado):** o sistema deve permitir conversa privada entre exatamente dois funcionários ativos.
- **RF-020 — Início livre de conversa (Aprovado):** qualquer funcionário ativo deve poder iniciar conversa com qualquer outro funcionário ativo, sem autorização prévia da TI.
- **RF-021 — Criação automática (Aprovado):** a conversa deve ser criada quando a primeira mensagem for enviada e aparecer nas listas dos dois participantes.
- **RF-022 — Histórico cronológico (Aprovado):** mensagens devem aparecer da mais antiga no topo à mais recente embaixo.
- **RF-023 — Carregamento progressivo (Aprovado):** mensagens antigas devem ser carregadas progressivamente quando o usuário rolar para cima.
- **RF-024 — Identificação visual (Aprovado):** mensagens enviadas devem ficar à direita e recebidas à esquerda.
- **RF-025 — Cabeçalho da conversa (Aprovado):** o cabeçalho deve exibir o nome completo do outro participante.
- **RF-026 — Lista de conversas (Aprovado):** conversas devem ser ordenadas pela atividade mais recente, considerando envio ou recebimento.
- **RF-027 — Separadores de data (Aprovado):** o histórico deve apresentar separadores de data no formato DD/MM/AAAA, sem rótulos relativos como “Hoje” ou “Ontem”.
- **RF-028 — Horário da mensagem (Aprovado):** cada mensagem deve exibir horário no formato HH:MM, em fuso horário único definido pela empresa.
- **RF-029 — Imutabilidade (Aprovado):** o sistema não deve oferecer edição ou exclusão de mensagens por funcionários ou administradores.
- **RF-030 — Retenção do histórico (Aprovado, sujeito à validação legal):** o sistema deve preservar o histórico sem exclusão automática, inclusive após desativação de conta.
- **RF-031 — Sem presença (Aprovado):** o sistema não deve exibir estados online, offline ou ausente.
- **RF-032 — Sem busca no conteúdo (Aprovado):** o sistema não deve oferecer busca textual dentro do corpo das mensagens.
- **RF-033 — Estado não lido (Aprovado):** a lista de conversas deve indicar visualmente conversas com mensagens não lidas, sem contador numérico.
- **RF-034 — Confirmação de entrega (Aprovado):** o remetente deve receber confirmação quando a mensagem for disponibilizada ao destinatário.
- **RF-035 — Confirmação de leitura (Aprovado):** o sistema deve registrar/exibir a leitura quando o destinatário abrir ou visualizar a conversa.
- **RF-036 — Entrega offline (Aprovado):** mensagens destinadas a usuário desconectado devem permanecer armazenadas como pendentes e ser disponibilizadas automaticamente quando ele se reconectar.

## 2.5 Anexos

- **RF-037 — Formatos permitidos (Aprovado):** o sistema deve aceitar somente arquivos PDF e JPEG.
- **RF-038 — Limite de tamanho (Aprovado):** o sistema deve aceitar arquivos de até 10 MB por envio.
- **RF-039 — Um arquivo por envio (Aprovado):** cada operação de envio deve conter no máximo um arquivo.
- **RF-040 — Arquivo sem texto (Aprovado):** o sistema deve permitir enviar o arquivo sem mensagem de texto acompanhante.
- **RF-041 — Validação de anexo (Aprovado):** o sistema deve bloquear formatos não permitidos e arquivos acima do limite, informando claramente o motivo.
- **RF-042 — Retenção de anexos (Aprovado, sujeito à validação legal):** anexos enviados devem ser preservados e não devem poder ser excluídos por usuários ou administradores.
- **RF-043 — Consulta autorizada de anexo (Aprovado):** administradores com permissão especial de visualização de conteúdo podem consultar o conteúdo integral dos anexos.

## 2.6 Notificações

- **RF-044 — Notificação interna (Aprovado):** o sistema deve apresentar notificações de novas mensagens dentro do aplicativo.
- **RF-045 — Notificação do navegador (Aprovado):** o sistema deve poder apresentar notificações do navegador, inclusive quando outra aba estiver em foco, condicionadas à permissão concedida pelo usuário/navegador.
- **RF-046 — Privacidade da notificação (Aprovado):** notificações não devem expor o conteúdo da mensagem.
- **RF-047 — Identificação do remetente (Aprovado, texto a validar):** a notificação deve informar que o usuário recebeu uma mensagem e identificar o remetente, por exemplo: “Você recebeu uma mensagem de [nome do remetente]”.

## 2.7 Administração, auditoria e permissões especiais

- **RF-048 — Permissão de conteúdo (Aprovado):** Administrador Principal de TI deve poder conceder e revogar, individualmente, a permissão especial de consultar conteúdo integral de mensagens e anexos.
- **RF-049 — Permissão de logs (Aprovado):** Administrador Principal de TI deve poder conceder e revogar, individualmente, a permissão especial de consultar registros de atividades administrativas.
- **RF-050 — Separação de permissões (Aprovado):** as permissões de conteúdo e de consulta de logs devem ser independentes.
- **RF-051 — Registro de ações administrativas (Aprovado):** o sistema deve registrar criação, ativação, desativação, redefinição de senha, criação/promoção de administrador, alteração de permissões, alteração de estado de conta administrativa e substituição do Administrador Principal.
- **RF-052 — Registro de consultas (Aprovado):** consultas administrativas de conteúdo e de logs devem ser registradas.
- **RF-053 — Tentativa não autorizada (Aprovado):** o sistema deve bloquear e registrar tentativas de acesso a funções ou dados sem permissão.
- **RF-054 — Integridade dos logs (Aprovado):** administradores, inclusive Administrador Principal, não devem poder editar ou excluir registros de auditoria pelo aplicativo.
- **RF-055 — Consulta integral de mensagem (Aprovado):** somente administradores com a permissão especial de conteúdo podem consultar o conteúdo integral de mensagens.
- **RF-056 — Consulta de registros (Aprovado):** somente administradores com a permissão especial de logs podem consultar registros administrativos.
- **RF-057 — Substituição do Administrador Principal (Aprovado):** a nomeação de novo Administrador Principal deve ocorrer por designação institucional do RIAS, fora do fluxo administrativo comum, e deve ser documentada e rastreável.
