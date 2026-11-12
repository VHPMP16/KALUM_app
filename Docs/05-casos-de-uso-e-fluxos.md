# 5. Casos de uso e fluxos

Este documento descreve casos de uso em texto. Não introduz novos diagramas UML além dos dois aprovados e referenciados nos documentos 07 e 08.

## Atores

- **Funcionário ativo:** usuário comum com conta ativa.
- **Administrador de TI:** administrador autorizado para gestão de contas de funcionários.
- **Administrador Principal de TI:** administrador com poderes adicionais de gestão administrativa e concessão/revogação de permissões especiais.
- **RIAS:** autoridade institucional externa ao fluxo comum do aplicativo, responsável por designar substituto do Administrador Principal.

## UC-001 — Autenticar-se

**Ator:** funcionário ou administrador com conta ativa.  
**Pré-condições:** conta cadastrada e ativa.  
**Fluxo principal:**
1. O usuário informa e-mail corporativo e senha.
2. O sistema valida as credenciais e o estado da conta.
3. O sistema inicia a sessão e apresenta a área principal.
**Exceções:** credenciais inválidas; conta inativa; bloqueio temporário por tentativas consecutivas.  
**Pós-condição:** usuário autenticado ou tentativa recusada com proteção aplicada.

## UC-002 — Criar conta de funcionário

**Ator:** Administrador de TI ou Administrador Principal.  
**Pré-condições:** administrador autenticado e autorizado.  
**Fluxo principal:**
1. Administrador informa nome completo, e-mail corporativo e senha inicial.
2. Sistema verifica a unicidade do e-mail.
3. Sistema cria a conta.
4. Sistema registra a ação administrativa.
**Exceções:** e-mail já utilizado ou dados inválidos.  
**Pós-condição:** conta criada; estado inicial deverá ser confirmado na definição técnica/operacional.

## UC-003 — Administrar conta de funcionário

**Ator:** Administrador de TI ou Administrador Principal.  
**Pré-condições:** administrador autenticado e conta de funcionário identificada.  
**Fluxo principal:** administrador ativa, desativa ou redefine a senha; sistema aplica a operação e registra a ação.  
**Pós-condição:** alteração aplicada e auditável.  
**Regra:** desativação não apaga histórico.

## UC-004 — Administrar contas administrativas

**Ator:** Administrador Principal.  
**Pré-condições:** Administrador Principal autenticado.  
**Fluxo principal:** cria/promove administrador de TI ou ativa/desativa uma conta administrativa; sistema valida a autorização e registra a ação.  
**Exceção:** tentativa por Administrador de TI comum deve ser bloqueada e registrada.

## UC-005 — Consultar diretório

**Ator:** funcionário ou administrador autenticado.  
**Pré-condições:** conta ativa.  
**Fluxo principal:** usuário abre o diretório, pesquisa por nome e visualiza resultados alfabéticos de funcionários ativos.  
**Pós-condição:** contatos disponíveis para iniciar conversa.

## UC-006 — Iniciar conversa e enviar mensagem

**Ator:** funcionário ativo.  
**Pré-condições:** remetente e destinatário ativos.  
**Fluxo principal:**
1. Remetente seleciona um funcionário no diretório.
2. Redige e envia uma mensagem.
3. Sistema cria a conversa se ainda não existir.
4. Mensagem é armazenada e aparece na conversa dos participantes.
5. Lista de conversas é atualizada pela atividade mais recente.
**Exceções:** destinatário ou remetente deixa de estar ativo antes do envio; sistema deve impedir nova interação.  
**Pós-condição:** mensagem armazenada e estado de entrega acompanhado.

## UC-007 — Receber mensagem e confirmar entrega/leitura

**Ator:** destinatário ativo.  
**Pré-condições:** mensagem destinada ao usuário.  
**Fluxo principal:**
1. Se conectado, o sistema disponibiliza a mensagem.
2. Sistema registra estado de entrega.
3. Remetente recebe confirmação de entrega.
4. Quando destinatário abre/visualiza a conversa, sistema registra leitura.
**Fluxo alternativo:** se desconectado, a mensagem permanece pendente e é disponibilizada após reconexão.  
**Pós-condição:** estado da mensagem atualizado conforme evento ocorrido.

## UC-008 — Enviar anexo

**Ator:** funcionário ativo.  
**Pré-condições:** conversa entre participantes ativos.  
**Fluxo principal:**
1. Usuário seleciona um arquivo.
2. Sistema valida formato PDF/JPEG, tamanho máximo de 10 MB e quantidade de um arquivo por operação.
3. Se válido, sistema armazena e associa o anexo à mensagem/conversa.
4. O arquivo pode ser enviado sem texto.
**Exceções:** formato não permitido ou tamanho excedido; sistema rejeita e explica o motivo.  
**Pós-condição:** anexo armazenado e preservado conforme política aprovada, sujeita à validação legal.

## UC-009 — Receber notificação

**Ator:** destinatário.  
**Pré-condições:** nova mensagem recebida; permissão do navegador quando aplicável.  
**Fluxo principal:** sistema exibe notificação interna e, se autorizado pelo navegador, notificação do navegador sem conteúdo da mensagem, identificando o remetente.  
**Pós-condição:** usuário é informado sobre nova mensagem sem exposição do texto.

## UC-010 — Gerenciar foto de perfil

**Ator:** funcionário autenticado.  
**Fluxo principal:** usuário adiciona, altera ou remove sua foto; quando não houver foto, sistema exibe iniciais.  
**Pós-condição:** perfil atualizado sem alteração do nome exibido.

## UC-011 — Consultar conteúdo para auditoria

**Ator:** administrador com permissão especial de conteúdo.  
**Pré-condições:** administrador autenticado e permissão específica ativa.  
**Fluxo principal:** administrador acessa o recurso autorizado, consulta conteúdo integral da mensagem ou anexo e o sistema registra a consulta.  
**Exceções:** sem permissão, acesso bloqueado e tentativa registrada.  
**Pós-condição:** consulta auditável; conteúdo original permanece imutável.

## UC-012 — Consultar logs administrativos

**Ator:** administrador com permissão especial de logs.  
**Pré-condições:** administrador autenticado e permissão específica ativa.  
**Fluxo principal:** administrador consulta os registros disponíveis; sistema registra a consulta.  
**Exceções:** sem permissão, acesso bloqueado e tentativa registrada.  
**Pós-condição:** consulta auditável; logs não podem ser alterados ou excluídos pelo aplicativo.

## UC-013 — Designar novo Administrador Principal

**Ator:** RIAS, por procedimento institucional externo ao fluxo comum.  
**Pré-condições:** decisão formal da organização.  
**Fluxo principal:** RIAS designa o substituto; a organização executa o procedimento de provisionamento e registra a substituição de forma rastreável.  
**Ponto pendente:** mecanismo técnico de provisionamento, validação da designação e evidência documental precisam ser definidos.  
**Pós-condição:** novo Administrador Principal designado e evento documentado/auditável.
