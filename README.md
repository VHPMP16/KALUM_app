# KALUM_app

Uma aplicação web de comunicação interna que conecta **exclusivamente os funcionários da Kalunga** em conversas privadas e individuais.

O KALUM_app tem como objetivo oferecer um canal corporativo próprio para troca de mensagens entre funcionários ativos, com gestão de contas pela equipe de TI, histórico de conversas, envio controlado de anexos e recursos de auditoria sujeitos a permissões específicas.

> **Status:** em desenvolvimento inicial. Este repositório contém a estrutura inicial do projeto; funcionalidades e decisões técnicas serão detalhadas à medida que o desenvolvimento avançar.

## Público-alvo

| Perfil | Utilização |
| --- | --- |
| **Funcionários** | Iniciar conversas individuais, enviar e receber mensagens e consultar o próprio histórico. |
| **Administradores de TI** | Utilizar o chat e realizar tarefas autorizadas de gerenciamento de contas. |
| **Administrador Principal de TI** | Gerenciar administradores e conceder ou revogar permissões especiais de auditoria. |

O sistema é destinado exclusivamente à comunicação interna entre funcionários. **Clientes, fornecedores e usuários externos não fazem parte do público-alvo.**

## Funcionalidades previstas

- Conversas privadas individuais entre funcionários ativos.
- Cadastro e gerenciamento de contas exclusivamente pela equipe de TI.
- Histórico de mensagens permanente e imutável.
- Confirmações de entrega e leitura.
- Envio de anexos PDF e JPEG, limitados a 10 MB por arquivo.
- Notificações dentro da aplicação e do navegador.
- Perfis com iniciais como avatar padrão e foto opcional.
- Auditoria de mensagens e atividades administrativas mediante permissões específicas.

## Plataforma e tecnologias

- **Hospedagem e implantação:** Vercel.
- **Plataforma de backend e dados:** Supabase.
- **Frontend, linguagem, frameworks e arquitetura:** a definir pela equipe técnica.

## Escopo inicial de dispositivos

A primeira versão será uma aplicação web voltada a **computadores desktop**, com prioridade de compatibilidade para o Google Chrome. Experiência mobile não faz parte do escopo inicial aprovado.

## Documentação

A documentação funcional e técnica do projeto será mantida na pasta [Docs/](Docs/).

## Como começar

As instruções de instalação e execução serão adicionadas quando a estrutura de código e as configurações de ambiente estiverem definidas.

## Contribuição

1. Crie uma branch a partir de `main`.
2. Faça alterações pequenas e focadas.
3. Registre commits claros.
4. Abra um pull request explicando o que mudou e por quê.

## Licença

Distribuído sob a [Licença MIT](LICENSE).
