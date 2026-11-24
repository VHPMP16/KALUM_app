# KALUM_app — Comunicação Corporativa

Aplicação web de comunicação interna da Kalunga, destinada exclusivamente a funcionários com contas corporativas ativas e à equipe de TI autorizada.

Este repositório preserva a documentação de requisitos já existente em `Docs/` e incorpora a implementação Next.js/Supabase do ChatApp. A documentação técnica da implementação fica em `docs/`.

## Stack
- Next.js 16, React 19 e TypeScript
- Supabase Auth, PostgreSQL, RLS, Realtime e Storage
- Tailwind CSS
- Vercel
- Node.js 22.x

## Configuração local
1. Instale Node.js 22.x.
2. Execute `npm ci`.
3. Copie `.env.example` para `.env.local`.
4. Preencha as variáveis do projeto Supabase de desenvolvimento.
5. Execute `npm run dev`.

## Verificações
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Banco de dados e segurança
As migrations versionadas estão em `supabase/migrations/`. Revise-as e aplique-as somente ao projeto Supabase de desenvolvimento autorizado. Use exclusivamente dados fictícios.

O fluxo de anexos permanece em quarentena: não habilitar upload operacional nem download até integrar e validar um scanner antimalware real. A limitação do plano Free referente à proteção contra senhas vazadas continua registrada como pendência, não como resolvida.

## Documentação
- `Docs/`: documentação de requisitos e produto preexistente do KALUM_app.
- `docs/ARQUITETURA-TECNICA.md`: arquitetura técnica da implementação.
- `docs/PLANO-TESTES-SQA.md`: plano de testes.
- `docs/SECURITY-EXCEPTION-LEAKED-PASSWORDS-FREE.md`: pendência de segurança.
- `docs/INCIDENTE-ENVIO-MENSAGENS-2026-11-20.md`: registro técnico de incidente e correção.

## Compatibilidade de escopo
A implementação importada inclui funcionalidades adicionais (por exemplo, grupos e busca global) que devem ser confrontadas com os requisitos aprovados em `Docs/` antes de qualquer liberação. A documentação original foi mantida sem alterações.

Não considerar o sistema pronto para produção sem testes completos, revisão de segurança e validação operacional.
