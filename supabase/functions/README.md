# Edge Function: invite-employee

A função envia convites pelo Supabase Auth e só aceita chamadas com JWT válido de um perfil ativo que possua o papel `it_admin`.

## Configuração obrigatória

No Supabase Dashboard, abra **Edge Functions → Secrets** e adicione:

- `ALLOWED_EMAIL_DOMAINS`: lista separada por vírgulas dos domínios corporativos permitidos (ex.: `empresa.example,subsidiaria.example`). Use somente domínios de teste/autorizados do projeto; não use um domínio presumido.
  
Sem essa variável a função falha de forma fechada com `domain_allowlist_not_configured`. O domínio precisa ser informado pelo responsável pelo ambiente.

## Fluxo

1. Administrador de TI informa nome e e-mail no painel `/admin`.
2. A Edge Function valida JWT, perfil ativo, papel `it_admin`, formato do e-mail e domínio permitido.
3. Supabase Auth envia o convite. O trigger `on_auth_user_created` cria o perfil com status `pending_invitation`.
4. A função grava o evento `admin.invitation_sent` por RPC autenticado.
5. Após o primeiro acesso e a validação administrativa, a TI ativa o perfil e concede o papel `employee`.

A chave secreta do projeto nunca é enviada ao navegador. A função exige JWT (`verify_jwt=true`).
