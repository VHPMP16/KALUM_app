# Exceção de segurança — proteção contra senhas vazadas (plano Free)

**Projeto:** ChatApp — Supabase Free de desenvolvimento  
**Data do registro:** 18/11/2026  
**Status:** PENDENTE / RISCO RESIDUAL CONHECIDO  
**Finding:** `auth_leaked_password_protection` — `WARN`

## Evidência

Na verificação do Supabase Security Advisor em 18/11/2026, foi retornado:

- Finding: `Leaked Password Protection Disabled`
- Nível: `WARN`
- Descrição: a proteção contra senhas vazadas está desativada.
- Remediação indicada: https://supabase.com/docs/guides/auth/password-security

A documentação oficial do Supabase informa que a prevenção de senhas vazadas via HaveIBeenPwned.org está disponível no plano Pro ou superior. O projeto deve permanecer no plano Free, portanto esse controle não pode ser habilitado neste ambiente sem mudança de plano.

## Decisão e impacto

A limitação é mantida conscientemente no plano Free. **Este finding não está resolvido.** Regras de complexidade e tamanho não verificam se uma senha foi previamente exposta em vazamentos. O risco residual inclui reutilização de credenciais comprometidas e ataques de credential stuffing.

O ambiente continua restrito a desenvolvimento/demonstração com dados sintéticos. Esta exceção não constitui autorização para produção.

## Medidas compensatórias

As medidas abaixo são o baseline a verificar/configurar em Authentication → Settings / Providers no Dashboard. Não registrar como concluídas sem evidência:

1. **Provisionamento restrito:** desabilitar cadastro público e login anônimo; contas criadas somente por convite administrativo autorizado.
2. **Força de senha:** definir mínimo de 12 caracteres (preferência 14 ou mais) e exigir minúsculas, maiúsculas, números e símbolos, conforme opções disponíveis no projeto.
3. **Verificação de e-mail:** manter confirmação de e-mail habilitada para o fluxo de convite/identidade, quando aplicável.
4. **Abuso de autenticação:** manter limites de taxa adequados para endpoints de Auth e monitorar falhas repetidas; não relaxar limites para contornar erros.
5. **Privilégio administrativo:** exigir MFA para administradores quando disponível e validado; restringir contas administrativas a pessoas autorizadas.
6. **Higiene de credenciais:** orientar uso de senhas únicas e gerenciador de senhas; proibir reutilização de senhas de outros serviços.
7. **Monitoramento e resposta:** revisar logs de Auth e desabilitar contas suspeitas; revogar sessões quando houver suspeita de comprometimento.
8. **Testes SQA:** validar senha abaixo do mínimo, senha sem classes exigidas, conta pendente/desabilitada, repetição de falhas de login e acesso administrativo.

## Evidências / estado atual

| Controle | Estado |
|---|---|
| Plano Free preservado | Confirmado por decisão do projeto |
| Finding no Security Advisor | WARN confirmado em 18/11/2026 |
| Signup público/anônimo desabilitado | A verificar no Dashboard |
| Comprimento e complexidade | A configurar/verificar no Dashboard |
| Confirmação de e-mail | A verificar no Dashboard |
| Rate limits / monitoramento | A verificar |
| MFA administrativo | A verificar disponibilidade e adoção |
| Testes negativos de Auth | Pendentes |
| Proteção contra senhas vazadas | **Não disponível no Free; não resolvida** |

## Critério para encerrar a exceção

A exceção só poderá ser reavaliada quando ocorrer uma destas condições:

- migração autorizada para plano que ofereça leaked password protection, seguida de habilitação e teste; ou
- mudança de plataforma/arquitetura com mecanismo equivalente, tecnicamente validado.

Até lá, manter o alerta aberto, registrar a aceitação formal do risco pelo responsável e não declarar o requisito de proteção contra senhas vazadas atendido.

## Referência oficial

Supabase — Password security: https://supabase.com/docs/guides/auth/password-security
