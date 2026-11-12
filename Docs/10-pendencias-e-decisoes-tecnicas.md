# 10. Pendências e decisões técnicas

Este documento evita que lacunas do levantamento sejam interpretadas como decisões já tomadas. Os responsáveis abaixo são sugeridos conforme a natureza do tema e devem ser confirmados pela equipe.

## 10.1 Pendências para definição

| ID | Tema | O que falta decidir | Responsável sugerido | Situação |
|---|---|---|---|---|
| P-001 | Framework e linguagem | Framework, linguagem e estrutura do frontend | Tech Lead e devs | Pendente |
| P-002 | Arquitetura | Arquitetura lógica, integração e organização de módulos | Tech Lead e devs | Pendente |
| P-003 | Supabase | Serviços utilizados, configuração, políticas e modelo de dados | Tech Lead e devs | Pendente |
| P-004 | Autorização | Estratégia técnica de autenticação, autorização e segregação de privilégios | Tech Lead e devs | Pendente |
| P-005 | Senhas | Política de complexidade, armazenamento e ciclo de vida | Tech Lead/TI | Pendente |
| P-006 | Bloqueio de login | Número de tentativas inválidas e duração do bloqueio temporário | Tech Lead/TI | Pendente |
| P-007 | Sessão | Tempo de expiração por inatividade e política de renovação | Tech Lead/TI | Pendente |
| P-008 | Chrome | Versão mínima suportada | PO, QA e Tech Lead | Pendente |
| P-009 | Desempenho | Metas para login, envio, entrega, abertura de conversa e histórico | PO, QA e Tech Lead | Pendente |
| P-010 | Disponibilidade | Meta de disponibilidade e janela de manutenção | Organização e Tech Lead | Pendente |
| P-011 | Escala | Quantidade de usuários simultâneos e volume esperado de mensagens/anexos | PO e organização | Pendente |
| P-012 | Mensagem | Tamanho máximo do texto e limites de envio | PO e Tech Lead | Pendente |
| P-013 | Fuso horário | Fuso horário corporativo único | Organização/PO | Pendente |
| P-014 | Backup | Frequência, retenção, RPO, RTO e testes de restauração | Tech Lead e organização | Pendente |
| P-015 | Retenção | Compatibilidade da retenção permanente com LGPD e políticas corporativas | Jurídico/Encarregado de dados | Pendente |
| P-016 | Requisições externas | Procedimento para requisições de autoridades e eventual notificação prévia | Jurídico e organização | Pendente |
| P-017 | Credenciais iniciais | Canal seguro para entrega de credenciais ao funcionário | TI e segurança | Pendente |
| P-018 | Design System | Disponibilização dos ativos e documentação do Design System Calunga | PO e UI/UX | Pendente |
| P-019 | Administrador Principal | Processo inicial de provisionamento e comprovação da designação institucional | Organização/RIAS e TI | Pendente |
| P-020 | Auditoria | Filtros, busca, exportação e escopo de consulta dos logs | PO, TI e Tech Lead | Pendente |
| P-021 | Notificações | Confirmar texto final e se a identificação será do remetente | PO | Pendente |
| P-022 | Perfil inicial | Definir se conta criada começa ativa ou em estado pendente | PO e TI | Pendente |
| P-023 | Arquivos JPEG | Confirmar tratamento de extensões MIME e variantes JPEG aceitas | Tech Lead e QA | Pendente |
| P-024 | Mensagem entregue | Definir precisamente o evento técnico que caracteriza disponibilização ao destinatário | Tech Lead e QA | Pendente |

## 10.2 Decisões já aprovadas

- Público restrito a funcionários da Kalunga.
- Conversas privadas individuais, sem grupos.
- Primeira versão desktop, com Google Chrome como navegador prioritário.
- Vercel Online como plataforma de hospedagem/publicação.
- Supabase Online como plataforma de backend e dados.
- Login por e-mail corporativo e senha, sem segundo fator na especificação inicial.
- Gestão de contas realizada pela TI; sem auto cadastro e sem autoatendimento de senha.
- Mensagens e anexos imutáveis pelo aplicativo.
- Anexos limitados a PDF/JPEG, até 10 MB, um por operação.
- Permissões especiais independentes para consulta de conteúdo e consulta de logs.
- Administrador Principal controla permissões especiais; RIAS designa substituto fora do fluxo comum.
- Dados criptografados em trânsito e em repouso.
- Somente dois artefatos UML aprovados: diagrama de classes e Diagrama de Visão Geral da Interação.

## 10.3 Riscos e validações obrigatórias

### Retenção permanente e LGPD

A solicitação de retenção permanente de mensagens, anexos e logs deve ser submetida à análise jurídica e de privacidade. A documentação registra a necessidade de preservação como regra de negócio solicitada, mas não conclui que retenção ilimitada seja juridicamente adequada em todos os casos. Devem ser avaliados finalidade, base legal, transparência, necessidade, prazos, direitos dos titulares e eventuais obrigações de preservação.

### Auditoria de conteúdo

A possibilidade de administradores autorizados lerem mensagens e anexos exige política formal de finalidade, autorização, registro de consultas, segregação de funções e transparência aos funcionários. A ausência de criptografia ponta a ponta tradicional decorre desse requisito de auditoria e deve ser tratada como decisão de segurança de alto impacto.

### Requisições de autoridades

A expectativa de notificação da empresa antes de eventual divulgação de dados não deve ser prometida como garantia técnica ou jurídica. O procedimento depende de validação jurídica, legislação aplicável e condições da requisição.

### Credenciais

A senha inicial e redefinições devem ser entregues por canal seguro a ser definido. Não se deve registrar senha em texto claro em logs ou documentação.

## 10.4 Critério de encerramento das pendências

Uma pendência será considerada resolvida quando houver decisão explícita, responsável identificado, registro da decisão e atualização dos documentos afetados. Decisões que alterem comportamento esperado precisam de aprovação do Product Owner; decisões de arquitetura e segurança devem ser registradas pelo Tech Lead e validadas com a equipe.
