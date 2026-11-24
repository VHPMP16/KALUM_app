# Plano de testes SQA — ChatApp

**Status:** casos especificados; execução ponta a ponta pendente.  
**Ambiente:** Supabase Free de desenvolvimento, somente dados sintéticos.  
**Regra:** nenhum caso será marcado como aprovado sem evidência reproduzível (contas de teste, resultado observado e logs/consulta pertinente).

## Pré-condições
- Duas contas sintéticas independentes: administrador de TI e funcionário.
- Uma terceira conta sintética para validar isolamento e grupos, quando disponível.
- `ALLOWED_EMAIL_DOMAINS` configurado com domínio de teste autorizado.
- Supabase Auth Site URL e Redirect URLs apontando para o ambiente de teste.
- Não usar dados, e-mails ou documentos reais da empresa.

## Casos prioritários

| ID | Tipo | Cenário | Resultado esperado | Status |
|---|---|---|---|---|
| SQA-01 | Segurança/Funcional | Funcionário tenta abrir `/admin` | Acesso negado e redirecionamento para o chat | Pendente |
| SQA-02 | Segurança | Conta `pending_invitation` tenta autenticar | Sessão não acessa áreas protegidas | Pendente |
| SQA-03 | Segurança | Conta desativada tenta reutilizar sessão | Acesso bloqueado no servidor e nas policies RLS | Pendente |
| SQA-04 | Funcional/Segurança | Admin convida e-mail em domínio permitido | Convite enviado, perfil criado pendente e evento auditado | Pendente |
| SQA-05 | Segurança | Admin tenta convidar domínio não permitido | Solicitação recusada sem criar usuário | Pendente |
| SQA-06 | Segurança | Funcionário chama Edge Function de convite | HTTP 403/recusa sem criação de usuário | Pendente |
| SQA-07 | Funcional | TI ativa perfil e atribui papel employee | Funcionário consegue entrar após aceitar convite | Pendente |
| SQA-08 | Segurança | Admin tenta desativar a própria conta ou último admin | Operação recusada e estado permanece inalterado | Pendente |
| SQA-09 | Funcional | Dois funcionários iniciam conversa direta | Uma conversa privada única é criada | Pendente |
| SQA-10 | Segurança/RLS | Usuário não participante consulta conversa/mensagens | Nenhum dado privado é retornado | Pendente |
| SQA-11 | Funcional | Membro cria grupo e adiciona participantes | Apenas membros ativos visualizam o grupo e as mensagens | Pendente |
| SQA-12 | Segurança | Usuário sem papel owner/admin tenta gerir membros | Operação recusada pelo banco | Pendente |
| SQA-13 | Funcional | Destinatário abre conversa com mensagens novas | Recibo de leitura é gravado para o destinatário | Pendente |
| SQA-14 | Funcional | Mensagem é recebida em outra conversa | Contador de não lidas aumenta; notificação do navegador aparece se permitida e aba estiver oculta | Pendente |
| SQA-15 | Funcional | Usuário pesquisa termo em suas conversas | Apenas resultados autorizados são exibidos, até 30 | Pendente |
| SQA-16 | Regressão | Usuário carrega mensagens anteriores | Histórico anterior é anexado sem duplicar ou inverter ordem | Pendente |
| SQA-17 | Segurança | Usuário tenta consultar recibos de conversa alheia | RLS impede acesso | Pendente |
| SQA-18 | Segurança/Arquivo | Usuário tenta baixar objeto em quarentena | Download não é permitido | Pendente |
| SQA-19 | Auditoria | TI ativa/desativa perfil, muda papel ou envia convite | Evento correspondente fica registrado na trilha privada | Pendente |
| SQA-20 | Limite/Regressão | Grupo excede 50 membros ou conversa direta excede 2 | Operação rejeitada pelo banco | Pendente |

## Verificações automatizadas executadas em 2026-11-19

| ID | Verificação | Resultado | Evidência |
|---|---|---|---|
| DB-SEC-01 | Nenhuma função do schema `private` executável por `anon` | Aprovado | Consulta `has_function_privilege('anon', ...)` após migração `20261119011619` retornou `false` para todas as funções auditadas. |
| DB-SEC-02 | Funções auxiliares RLS necessárias disponíveis a `authenticated` | Aprovado | Consulta de privilégios confirmou `EXECUTE` para `can_manage_conversation`, `can_view_profile`, `has_role`, `is_active_profile`, `is_active_user` e `is_conversation_member`. |
| DB-SEC-03 | Funções de trigger sem execução direta por usuários | Aprovado | `audit_group_member_removal`, `audit_message_insert`, `enforce_conversation_member_limit`, `handle_new_auth_user`, `touch_updated_at` e `validate_direct_conversation_insert` retornaram `false` para `authenticated` e `anon`. |
| DB-SEC-04 | Nenhum privilégio SQL de tabela/sequência para `anon` | Aprovado | Após migração `20261119011810`, `has_table_privilege` retornou `false` para SELECT/INSERT/UPDATE/DELETE em todas as tabelas públicas. |
| DB-SEC-05 | Papel `authenticated` sem privilégios de manutenção | Aprovado | `TRUNCATE`, `TRIGGER` e `MAINTAIN` retornaram `false` em todas as tabelas públicas. |
| DB-FUNC-01 | Leitura do perfil pelo papel autenticado | Aprovado | A auditoria identificou falta de SELECT em `public.profiles`, necessária ao login e diretório; migração `20261119011824` concedeu SELECT mantendo RLS. |

Essas verificações de privilégios não substituem testes de RLS com identidades reais independentes. Os 20 cenários funcionais abaixo continuam pendentes até execução autenticada reproduzível.

| DB-SEC-06 | Novas funções SQL sem execução automática por anon/authenticated | Aprovado | ACL padrão de funções do schema public não contém grants para anon ou authenticated após migração `20261119011915`. |
| DB-SEC-07 | Helper de auditoria não pode ser invocado diretamente por authenticated | Aprovado | `has_function_privilege('authenticated', 'private.log_conversation_event(text,uuid,jsonb)', 'EXECUTE')` retornou `false` após migração `20261119011943`. |

## Evidências a coletar
Para cada caso executado:
1. Identificador da conta sintética e papel atribuído (não registrar senhas/tokens).
2. Passos e resultado observado.
3. Captura de tela sem dados pessoais, quando aplicável.
4. Resposta HTTP/erro funcional sem token ou segredo.
5. Consulta SQL de verificação, sem exportar conteúdo privado.
6. Issue GitHub vinculada e resultado Pass/Fail/Blocked.

## Bloqueios conhecidos
- Convites reais dependem de allowlist de domínio e Redirect URLs confirmadas.
- Testes com duas ou mais contas ainda não foram executados.
- Anexos permanecem em quarentena até existir scanner antimalware real; não testar download como funcionalidade liberada.
- Notificações implementadas são do navegador, não notificações push server-side.
- CI valida lint, typecheck e build; não substitui estes testes de integração/E2E.


## Pacote final — novos cenários e evidências (2026-11-19)

### Casos adicionados

| ID | Tipo | Cenário | Resultado esperado | Status |
|---|---|---|---|---|
| SQA-21 | Funcional/Performance | Pesquisar funcionário, grupo e mensagem pela busca global | Resultados agrupados, termo destacado e consulta com debounce | Automatizado na CI; UI manual pendente |
| SQA-22 | Segurança/IDOR | Usuário não participante pesquisa mensagem/grupo privado | Nenhum resultado privado é retornado | Aprovado em transação SQL com dados sintéticos |
| SQA-23 | Funcional/Segurança | Consultar auditoria e registros com filtros e paginação | Filtros aplicados no servidor; detalhes disponíveis apenas a perfis autorizados | RPC validado; UI manual pendente |
| SQA-24 | Segurança/Funcional | Funcionário tenta consultar configurações e logs administrativos | Operação negada pelo banco | Aprovado em transação SQL |
| SQA-25 | Funcional/Regressão | TI altera habilitação e limite de criação de grupos | RPC de criação aplica as configurações persistidas | Aprovado em transação SQL |
| SQA-26 | Funcional/Usabilidade | Lista de conversas recebe mensagem em outra conversa | Prévia, remetente, horário e contador são atualizados | Implementado; teste visual manual pendente |
| SQA-27 | Segurança/Arquivo | Enviar arquivo fora do formato, acima de 5 MB ou com assinatura incompatível | Upload recusado antes do registro do anexo | Validação de frontend e banco coberta por testes automatizados; upload real pendente |
| SQA-28 | Segurança/IDOR | Membro tenta acessar status de anexo de conversa alheia | Acesso negado; caminho de objeto pendente não é exposto | Aprovado em transação SQL |
| SQA-29 | Segurança/Arquivo | Usuário tenta baixar anexo pendente/rejeitado | Storage não permite leitura; apenas status é apresentado | Política SELECT verificada; teste de download real pendente |
| SQA-30 | Auditoria/Segurança | TI exclui anexo | Objeto do Storage removido antes dos metadados; motivo obrigatório e evento auditado | Função transacional validada; exclusão real de objeto pendente |
| SQA-31 | Responsividade | Abrir busca, conversas e painel administrativo em mobile/tablet/desktop | Layout adapta colunas, filtros e navegação | Breakpoints verificados automaticamente; inspeção visual manual pendente |

### Validações de banco executadas

| ID | Verificação | Resultado | Evidência |
|---|---|---|---|
| DB-GLOB-01 | Busca global de mensagem dentro de grupo do qual o usuário participa | Aprovado | Fixture transacional retornou 1 resultado ao membro. |
| DB-GLOB-02 | Busca global da mesma mensagem por usuário não participante | Aprovado | Fixture transacional retornou 0 resultados ao não membro. |
| DB-ADM-01 | Acesso administrativo a configurações, auditoria e registros | Aprovado | RPCs executados com perfil IT Admin. |
| DB-ADM-02 | Funcionário sem papel administrativo consulta configurações | Aprovado | RPC negado com código 42501/forbidden. |
| DB-ADM-03 | Alteração de configurações gera eventos de auditoria e logs | Aprovado | Atualização executada em transação revertida; eventos consultados pelos RPCs administrativos. |
| DB-ADM-04 | Habilitação e limite máximo de grupos aplicados no RPC de criação | Aprovado | Criação permitida com configuração habilitada e bloqueada quando desabilitada; transações revertidas. |
| DB-CHAT-01 | Resumo de conversa retorna última mensagem, remetente e status do anexo | Aprovado | Fixture transacional retornou grupo, mensagem e status pending. |
| DB-CHAT-02 | Resumo de conversa não é retornado a usuário não membro | Aprovado | Consulta autenticada do não participante retornou 0 linhas. |
| DB-ATT-01 | Anexo pendente retorna status sem expor caminho de Storage | Aprovado | RPC retornou pending e object_path nulo. |
| DB-ATT-02 | Não participante tenta registrar ou consultar anexo | Aprovado | RPCs negaram acesso por ausência de associação ativa. |
| DB-ATT-03 | Exclusão administrativa exige justificativa e marca a mensagem como removida | Aprovado | Função validada em transação revertida; mensagem ficou com marcador [Anexo removido pela TI]. |
| DB-ATT-04 | Leitura de objeto no Storage | Aprovado por inspeção de policy | Policy SELECT permite apenas bucket chat-attachments, anexo com scan_status='clean' e membro da conversa. |
| DB-SEC-08 | Funções privilegiadas de criação não ficam como SECURITY DEFINER no schema público | Aprovado | Writers movidos para private; RPCs públicos usam wrappers SECURITY INVOKER. |
| CI-02 | Pipeline completa da branch | Aprovado | GitHub Actions CI #303: testes automatizados, lint, typecheck e build de produção concluídos com sucesso. |

### Limitações que continuam abertas

- Não existe scanner antimalware real integrado. Arquivos permanecem em chat-quarantine com status pending; a ação de liberação administrativa fica desabilitada. Não marcar como resolvido.
- O upload/download real via navegador e a exclusão física de objeto ainda precisam de teste manual autenticado no preview.
- Testes de comunicação entre duas ou mais contas independentes ainda dependem de contas de teste adicionais.
- A inspeção visual real em dispositivos/viewports ainda precisa ser executada; os breakpoints e estados responsivos foram verificados no código e na CI.
- O alerta Supabase auth_leaked_password_protection permanece aberto por decisão de manter o plano Free, com medidas compensatórias e documentação.
