# Incidente — falha no envio de mensagens (2026-11-20)

## Causa raiz confirmada

Os logs PostgreSQL registraram respostas HTTP 500 em POST /rest/v1/messages com SQLSTATE 42P17 e mensagem `infinite recursion detected in policy for relation messages`.

A política RLS de INSERT da tabela public.messages validava reply_to_id consultando a própria tabela messages diretamente. A avaliação da política acionava recursão infinita, impedindo o INSERT mesmo para usuário ativo e membro ativo da conversa.

## Correção aplicada

- Criada a função interna private.can_reference_message(uuid, uuid), SECURITY DEFINER, com search_path vazio e execução revogada de PUBLIC/anon.
- A função valida que a conta e a membership estão ativas e que a mensagem respondida, quando informada, pertence à mesma conversa.
- A política de INSERT foi recriada mantendo validação do remetente autenticado, conta ativa e participação ativa.
- A interface mantém o texto digitado em caso de falha, impede submissões simultâneas e registra somente código/mensagem/hint técnico sem conteúdo da mensagem.

## Validação

- Inserção de mensagem com role authenticated e JWT subject da conta administradora: aprovada em transação revertida (rollback).
- Consulta da função de autorização para a conta ativa/membro: retornou true.
- Criação de grupo via RPC e consulta do diretório foram exercitadas em transação de teste; alterações revertidas.
- GitHub Actions CI #314: testes, ESLint, TypeScript e build concluídos com sucesso.
- E2E com duas sessões independentes e recebimento Realtime ainda requer validação manual no Preview.

## Limitações não alteradas

- Scanner antimalware não integrado; anexos permanecem em quarentena.
- O alerta Supabase de proteção contra senhas vazadas permanece ativo no plano Free.
- Nenhuma alteração de RLS foi feita para permitir acesso não autorizado.
