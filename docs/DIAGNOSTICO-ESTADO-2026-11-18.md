# Diagnóstico do repositório — 18/11/2026

## Resumo executivo

O repositório contém documentação de arquitetura e gerenciamento do backlog, mas a árvore da branch `main` analisada contém somente o diretório `docs/`. Não havia aplicação, configuração de build, dependências ou migrations no início desta execução.

A primeira fundação Next.js foi criada na branch `feat/foundation-scaffold` e submetida para revisão no PR draft #82. Ela ainda não foi executada nem validada por build, lint ou typecheck.

## Estado do repositório no início do diagnóstico

- Repositório: `otaviosferreira/chatapp`
- Visibilidade: público
- Branch padrão: `main`
- Branches inicialmente identificadas: `main`
- Arquivos existentes: `docs/ARQUITETURA-TECNICA.md` e `docs/GERENCIAMENTO-70-ISSUES.md`
- README e `package.json`: inexistentes antes da fundação
- Histórico inicial: três commits, todos de documentação
- Documentação técnica: arquitetura Next.js, Supabase, PostgreSQL/RLS, Realtime, Storage privado, Vercel, ADRs, riscos e implantação

## Issues

O documento `docs/GERENCIAMENTO-70-ISSUES.md` define 70 Issues oficiais abertas:

| Responsabilidade | Intervalo | Quantidade |
|---|---:|---:|
| PO | #1–#10 | 10 |
| DEV1 | #11–#20 | 10 |
| DEV2 | #22–#31 | 10 |
| DEV3 | #32–#41 | 10 |
| SQA | #42–#51 | 10 |
| UX | #52–#61 | 10 |
| Tech Lead | #62–#71 | 10 |
| **Total oficial** | | **70** |

Na consulta ao GitHub foram encontradas 70 Issues abertas e 11 encerradas (#21 e #72–#81). As Issues encerradas não foram tratadas como funcionalidades concluídas; os corpos indicam encerramento por duplicidade/reorganização do backlog. As 70 Issues oficiais permanecem abertas.

Os status de um GitHub Projects board não foram confirmados nesta execução. A documentação do repositório registra que o quadro ainda precisa ser criado/vinculado e preenchido. As Issues não foram atribuídas a pessoas porque os logins dos integrantes não foram informados.

## Fundação criada nesta execução

Branch: `feat/foundation-scaffold`

Pull Request: [#82 — chore: establish initial Next.js application foundation](https://github.com/otaviosferreira/chatapp/pull/82)

Arquivos adicionados:
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `.eslintrc.json`
- `.gitignore`
- `.env.example`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `README.md`

A página inicial informa expressamente que o chat não está implementado. Não foram adicionadas credenciais, contas, mensagens ou dados reais.

## Supabase

A consulta de projetos Supabase disponíveis para a conexão retornou uma lista vazia. Portanto, não foi possível aplicar ou testar migrations em um projeto remoto. Nenhum projeto foi criado e nenhum banco remoto foi alterado.

Foi verificada a documentação oficial atual de RLS. Atenção à mudança de 30/10/2026: tabelas novas em `public` não são automaticamente expostas pela Data API; a exposição e os privilégios devem ser concedidos explicitamente, sempre com RLS habilitada e policies específicas. Autorização não deve depender de `user_metadata`; chaves secret/service_role nunca podem ser expostas ao browser.

## Validação e limitações

- Build: não executado.
- Lint: não executado.
- Typecheck: não executado.
- Testes unitários, integração, E2E e RLS: não executados.
- Clone local: falhou por indisponibilidade de resolução DNS para `github.com` no ambiente desta execução.
- PR #82: aberto como draft, aguardando execução de checks e revisão.

Não há evidência para declarar qualquer módulo funcional concluído.

## Próximas atividades prioritárias

1. Obter ambiente de execução com acesso ao npm e instalar dependências com lockfile versionado.
2. Executar build, lint e typecheck; corrigir problemas encontrados.
3. Criar/selecionar um projeto Supabase Free de desenvolvimento com dados sintéticos.
4. Gerar migrations via Supabase CLI e validar schema, grants e RLS.
5. Implementar Auth sem signup público, provisioning administrativo e bloqueio de contas desabilitadas.
6. Implementar conversas/mensagens e validar isolamento entre usuários.
7. Manter anexos desabilitados até scanner antimalware, quarentena e autorização de download estarem implementados e testados.

## Segurança

O ambiente permanece exclusivamente de desenvolvimento/demonstração. Não usar dados pessoais, documentos ou credenciais reais da Calunga. Não publicar em produção nem habilitar anexos sem os controles descritos na arquitetura.


## Atualização após o diagnóstico — fundação do PR #82

- Framework ajustado para Next.js 16.4.6 (linha Active LTS consultada em 18/11/2026) e React/React DOM 19.3.1.
- Lint ajustado para ESLint 10.15.0 com flat config, pois Next.js 16 removeu next lint.
- Node.js mínimo documentado: 20.19.0.
- Tailwind CSS permanece na linha 3.4.17 para manter a configuração inicial simples e compatível.
- O lockfile ainda não foi gerado; as dependências ainda precisam ser instaladas e validadas em ambiente com acesso ao registry npm.
- A conexão Supabase não lista projetos. Nenhuma migration foi aplicada ou criada para um projeto remoto; seguir com migrations exige projeto/ambiente local Supabase disponível e geração pelo CLI.
- Build, lint e typecheck continuam pendentes, sem alegação de aprovação.


## Atualização de execução — 18/11/2026, 19h (BRT)

Esta seção prevalece sobre os trechos históricos acima que descrevem ausência de Supabase, ausência de implementação ou CI pendente.

- Repositório: `otaviosferreira/chatapp`; branch `feat/foundation-scaffold`; PR draft #82.
- Supabase Free de desenvolvimento: projeto `chatapp-dev`, região São Paulo, uso exclusivo com dados sintéticos.
- Backend: schema com RLS, Storage privado e Realtime; painel de TI; RPCs para ativar/desativar perfis, administrar papéis e auditar convites; Edge Function `invite-employee` implantada com JWT obrigatório, papel `it_admin` e allowlist `ALLOWED_EMAIL_DOMAINS`.
- Conta de bootstrap verificada: um perfil ativo com papel `it_admin`.
- Frontend: login/logout, conversas diretas e grupos privados, envio de mensagens, Realtime, gestão de membros, pesquisa de mensagens, recibos de leitura, contadores de não lidas, notificações do navegador em primeiro plano/aba oculta e paginação do histórico.
- CI #123 (busca) aprovado. CI #134 (recibos, notificações e paginação) ainda está em fila/execução nesta atualização; não declarar aprovação até conclusão.
- Migration adicional `20261118221000_enable_message_receipts_realtime.sql` aplicada ao Supabase e versionada no repositório.
- Segurança: Security Advisor aponta apenas proteção contra senhas vazadas desativada; Health Advisor sem findings. A configuração de allowlist e Redirect URLs deve ser confirmada no ambiente antes de convites reais.
- Não foram executados convites reais nem testes E2E com duas contas independentes. Não há deploy frontend em produção e a PR não foi mesclada.

### Pendências restantes

1. Testes SQA ponta a ponta com pelo menos duas contas sintéticas: convite, domínio permitido/negado, ativação, desativação, papéis, conversas privadas, RLS, recibos e auditoria.
2. Confirmar Site URL/Redirect URLs do Supabase Auth e o valor do secret `ALLOWED_EMAIL_DOMAINS` (o valor do secret não é legível pela integração).
3. Scanner antimalware real e pipeline de quarentena/liberação de anexos. Não liberar downloads antes disso.
4. Revisar limites do plano Free, retenção e comportamento de notificações; notificações atuais são do navegador, sem push server-side garantido.
5. Revisão de segurança final, testes de regressão e aprovação humana antes de merge/deploy.
