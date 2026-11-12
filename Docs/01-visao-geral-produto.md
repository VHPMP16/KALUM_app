# 1. Visão geral do produto

## 1.1 Identificação

- **Produto:** KALUM_app
- **Organização atendida:** Kalunga
- **Tipo:** aplicação web de comunicação interna
- **Público:** funcionários com conta corporativa ativa
- **Plataformas aprovadas:** Vercel Online (hospedagem/publicação) e Supabase Online (plataforma de backend e dados)
- **Navegador prioritário:** Google Chrome
- **Experiência inicial:** desktop

## 1.2 Problema

A organização deseja disponibilizar um canal próprio para comunicação interna entre funcionários, reduzindo a dependência de aplicativos externos de mensagens para assuntos corporativos. A solução deverá manter o acesso sob administração da organização e oferecer mecanismos controlados de gestão de contas, auditoria e consulta autorizada de informações.

A expectativa relatada de que a organização seja notificada antes de eventual fornecimento de mensagens a autoridades externas depende de análise jurídica, contratual e operacional. Não é considerada funcionalidade garantida nesta especificação.

## 1.3 Objetivo

Entregar uma aplicação web que permita a funcionários ativos trocar mensagens privadas individualmente, enviar anexos permitidos e consultar o histórico, enquanto perfis autorizados de TI administram contas e, mediante permissões específicas, realizam atividades de auditoria.

## 1.4 Usuários e atores

1. **Funcionário:** utiliza o chat, diretório, perfil e notificações.
2. **Administrador de TI:** utiliza o chat e administra contas de funcionários.
3. **Administrador Principal de TI:** utiliza o chat, administra contas e controla concessão/revogação das permissões especiais de auditoria.
4. **RIAS — Responsável Institucional pela Administração do Sistema:** pessoa autorizada pela empresa a nomear um novo Administrador Principal fora do fluxo comum do aplicativo. Não é um perfil operacional nem recebe permissões automáticas no sistema.

## 1.5 Escopo da primeira versão

- Autenticação por e-mail corporativo e senha.
- Criação individual de contas pela equipe de TI.
- Ativação, desativação e redefinição de senha conforme permissões.
- Diretório de funcionários ativos com busca por nome.
- Conversas privadas entre duas pessoas, sem grupos.
- Envio e recebimento de mensagens e confirmação de entrega/leitura.
- Envio de um anexo PDF ou JPEG por operação, até 10 MB.
- Histórico de conversas e indicador visual de mensagens não lidas.
- Notificações dentro do aplicativo e notificações do navegador, conforme permissão.
- Administração de permissões especiais de auditoria.
- Registro de atividades administrativas e de consultas de auditoria.

## 1.6 Fora do escopo inicial

- Cadastro público ou auto cadastro.
- Contas para clientes, fornecedores ou pessoas externas.
- Conversas em grupo.
- Aplicativo móvel nativo ou experiência mobile como prioridade da primeira versão.
- Edição ou exclusão de mensagens e anexos.
- Envio de áudio, vídeo, arquivos do Office ou formatos diferentes de PDF/JPEG.
- Indicadores de presença online, offline ou ausente.
- Busca textual dentro do conteúdo das mensagens.
- Autorredefinição ou alteração de senha pelo funcionário.

## 1.7 Experiência e interface

A experiência deverá ser familiar a usuários de aplicativos de mensagens, com mensagens enviadas alinhadas à direita, recebidas à esquerda, conversa ordenada cronologicamente e lista de conversas ordenada pela atividade mais recente.

A interface deverá seguir o Design System corporativo referido no levantamento como **Design System Calunga**. O acesso aos seus ativos ainda não foi disponibilizado à equipe e é uma dependência de UX/UI.

## 1.8 Premissas e restrições

- Somente funcionários com contas ativas podem autenticar-se e participar de novas conversas.
- O uso inicial é desktop, com prioridade para Google Chrome.
- A infraestrutura escolhida em nível de plataforma é Vercel Online e Supabase Online.
- Framework, linguagem, arquitetura detalhada, serviços específicos do Supabase, configuração de segurança e modelagem física permanecem decisões técnicas.
- O histórico foi solicitado como permanente e imutável; essa política precisa de validação jurídica e de privacidade antes de ser adotada operacionalmente.

## 1.9 Equipe do projeto

Equipe informada: 1 Product Owner, 1 Tech Lead, 3 desenvolvedores, 1 analista de QA e 1 profissional de UI/UX.

## 1.10 Indicadores de conclusão funcional

A primeira versão deverá demonstrar, por testes, que funcionários ativos conseguem trocar mensagens privadas, que contas inativas não acessam o sistema, que anexos fora das regras são bloqueados e que ações administrativas e consultas especiais ficam registradas.
