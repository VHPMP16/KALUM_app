# 3. Requisitos não funcionais

Os requisitos abaixo definem atributos de qualidade e restrições. Quando não existe métrica aprovada, o item é explicitamente marcado como pendente, para evitar metas inventadas.

## 3.1 Segurança e privacidade

- **RNF-001 — Criptografia em trânsito (Aprovado):** comunicações entre navegador e serviços devem utilizar canal criptografado.
- **RNF-002 — Criptografia em repouso (Aprovado):** dados armazenados devem permanecer criptografados em repouso.
- **RNF-003 — Controle de acesso (Aprovado):** o acesso a funções e dados deve respeitar perfil, estado da conta e permissões específicas.
- **RNF-004 — Auditoria (Aprovado):** ações administrativas e consultas especiais devem produzir registros rastreáveis.
- **RNF-005 — Sem E2EE tradicional (Aprovado):** a solução não adotará criptografia ponta a ponta tradicional, pois o requisito de auditoria autorizada prevê consulta institucional ao conteúdo. A arquitetura deverá documentar os controles compensatórios de segurança e acesso.
- **RNF-006 — Proteção de credenciais (Pendente de detalhamento):** senhas devem ser tratadas conforme práticas seguras de armazenamento e autenticação; algoritmo, parâmetros e política de senha serão definidos tecnicamente.
- **RNF-007 — Sessões (Pendente de parametrização):** sessões devem expirar após inatividade e tentativas consecutivas inválidas devem provocar bloqueio temporário. Limites e duração precisam ser definidos.
- **RNF-008 — Princípio do menor privilégio (Aprovado):** permissões especiais de auditoria devem ser concedidas apenas a administradores designados e somente para a finalidade autorizada.

## 3.2 Compatibilidade e plataforma

- **RNF-009 — Navegador prioritário (Aprovado):** Google Chrome é o navegador prioritário da primeira versão.
- **RNF-010 — Versão mínima (Pendente):** a versão mínima do Chrome ainda deve ser definida e documentada.
- **RNF-011 — Plataforma inicial (Aprovado):** a primeira versão será orientada a computadores/desktop. Suporte mobile não é requisito de escopo inicial.
- **RNF-012 — Hospedagem (Aprovado):** a plataforma de hospedagem/publicação escolhida é Vercel Online.
- **RNF-013 — Backend e dados (Aprovado):** a plataforma escolhida para backend e dados é Supabase Online. Serviços específicos e configurações permanecem pendentes.

## 3.3 Usabilidade e interface

- **RNF-014 — Familiaridade (Aprovado):** a interação de mensagens deve seguir convenções familiares de aplicativos de chat, sem reproduzir indevidamente marcas ou ativos de terceiros.
- **RNF-015 — Design System (Aprovado como diretriz):** a interface deverá seguir o Design System corporativo referido como Calunga; acesso aos ativos ainda é dependência.
- **RNF-016 — Feedback de validação (Aprovado):** erros de formato e tamanho de anexos devem informar claramente o motivo da rejeição.
- **RNF-017 — Notificações discretas (Aprovado):** notificações não devem exibir o conteúdo da mensagem.

## 3.4 Desempenho, disponibilidade e capacidade

- **RNF-018 — Desempenho (Pendente):** metas mensuráveis para tempo de login, abertura de conversa, envio/entrega de mensagem e carregamento do histórico devem ser definidas antes dos testes de desempenho.
- **RNF-019 — Disponibilidade (Pendente):** meta de disponibilidade e janela de manutenção ainda não foram definidas.
- **RNF-020 — Capacidade (Pendente):** volume esperado de funcionários simultâneos, mensagens, anexos e crescimento de armazenamento precisa ser estimado.
- **RNF-021 — Limite de mensagem (Pendente):** tamanho máximo do texto de uma mensagem ainda não foi definido.

## 3.5 Continuidade, retenção e conformidade

- **RNF-022 — Backup e recuperação (Pendente):** frequência de backup, retenção dos backups, RPO e RTO devem ser definidos pela equipe técnica e pela organização.
- **RNF-023 — Retenção (Aprovado como regra solicitada, pendente de validação):** o levantamento solicita retenção permanente de mensagens, anexos e registros; a política precisa ser validada quanto à LGPD, obrigações legais, finalidade, necessidade e direitos dos titulares.
- **RNF-024 — Conformidade legal (Pendente):** a organização deve validar base legal, transparência, prazos de retenção, atendimento a solicitações de titulares e procedimentos para requisições de autoridades.
- **RNF-025 — Fuso horário (Pendente):** deve ser definido um único fuso horário corporativo para apresentação de datas e horários.
- **RNF-026 — Entrega confiável (Aprovado como comportamento):** mensagens destinadas a usuários desconectados devem permanecer pendentes até que possam ser disponibilizadas após reconexão; garantias operacionais e metas de recuperação serão definidas tecnicamente.

## 3.6 Critérios de mensuração pendentes

Antes de declarar a solução pronta para produção, a equipe deverá estabelecer valores objetivos para desempenho, disponibilidade, capacidade, compatibilidade mínima, política de senha, bloqueio de tentativas, expiração de sessão, backup e recuperação. A ausência desses valores não deve ser preenchida por suposição.
