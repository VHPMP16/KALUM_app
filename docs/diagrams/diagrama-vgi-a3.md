# DIAGRAMA VGI A3 — KALUM_app

**Tipo:** Diagrama de Visão Geral da Interação (UML)  
**Fonte:** reconstrução documental a partir do diagrama apresentado pela equipe no Miro, identificado como **DIAGRAMA VGI A3**.

O diagrama abaixo consolida os principais participantes, decisões e fluxos do KALUM_app. Foi organizado em Mermaid para permanecer versionável e legível no GitHub.

## Visão geral dos fluxos

```mermaid
flowchart TB
    subgraph FUNC["Funcionário (Empregado)"]
        F1([Acessar KALUM_app])
        F2[Informar e-mail e senha]
        F3[Selecionar conversa]
        F4[Digitar mensagem]
        F5[Selecionar anexo]
        F6[Visualizar retorno do sistema]
    end

    subgraph ADMIN["Administrador de TI"]
        A1[Entrar no painel administrativo]
        A2[Solicitar criação de usuário]
        A3[Solicitar ativação ou desativação]
        A4[Consultar auditoria]
    end

    subgraph RH["RH"]
        R1[Comunicar desligamento do funcionário]
    end

    subgraph SISTEMA["Sistema KALUM_app"]
        S1[Validar credenciais]
        D1{Credenciais válidas?}
        D2{Conta ativa?}
        S2[Autorizar acesso]
        S3[Validar sessão e permissões]
        D3{Permissão administrativa?}
        S4[Cadastrar usuário e preparar credenciais]
        S5[Atualizar status da conta]
        S6[Armazenar mensagem]
        S7[Validar formato do anexo]
        D4{Formato PDF ou JPEG?}
        S8[Armazenar anexo]
        S9[Bloquear envio e informar usuário]
        D5{Permissão para auditoria?}
        S10[Consultar registros e mensagens autorizadas]
        S11[Registrar evento de auditoria]
        S12[Negar operação]
    end

    subgraph DB["Banco de Dados"]
        B1[(Usuários)]
        B2[(Conversas e mensagens)]
        B3[(Anexos)]
        B4[(Registros de auditoria)]
    end

    F1 --> F2 --> S1
    S1 --> B1
    B1 --> D1
    D1 -- Não --> F6
    D1 -- Sim --> D2
    D2 -- Não --> F6
    D2 -- Sim --> S2
    S2 --> F3
    F3 --> F4 --> S3
    S3 --> S6 --> B2
    S6 --> F6

    F3 --> F5 --> S7
    S7 --> D4
    D4 -- Sim --> S8 --> B3
    D4 -- Não --> S9 --> F6

    A1 --> A2 --> S3
    S3 --> D3
    D3 -- Sim --> S4 --> B1
    S4 --> S11 --> B4
    D3 -- Não --> S12

    R1 --> A3 --> S3
    D3 -- Sim --> S5 --> B1
    S5 --> S11
    S5 -. "Preserva histórico" .-> B2

    A1 --> A4 --> S3
    S3 --> D5
    D5 -- Sim --> S10 --> B4
    D5 -- Não --> S12
    S10 --> S11
    S11 --> B4

    classDef actor fill:#fff2cc,stroke:#b8860b,color:#222,stroke-width:1.5px;
    classDef decision fill:#fce4d6,stroke:#c65911,color:#222,stroke-width:1.5px;
    classDef storage fill:#d9ead3,stroke:#38761d,color:#222,stroke-width:1.5px;
    class F1,F2,F3,F4,F5,F6,A1,A2,A3,A4,R1 actor;
    class D1,D2,D3,D4,D5 decision;
    class B1,B2,B3,B4 storage;
```

## Regras de negócio representadas

- O cadastro de funcionários é restrito ao Administrador de TI; não existe auto cadastro público.
- O acesso depende de credenciais válidas e conta ativa.
- Somente usuários autenticados e autorizados podem executar operações.
- O envio de anexos aceita somente PDF e JPEG; outros formatos são bloqueados.
- O RH comunica desligamentos ao TI, que desativa a conta.
- Contas são desativadas ou reativadas, nunca excluídas; o histórico de mensagens é preservado.
- A consulta de auditoria exige permissão e também deve gerar registro de auditoria.

## Observações para validação

1. Confirmar com o Product Owner se os fluxos e atores correspondem à versão aprovada dos requisitos.
2. Definir com a equipe técnica quais mensagens e metadados podem ser consultados na auditoria, respeitando privacidade e legislação aplicável.
3. Confirmar a política de entrega de credenciais iniciais e o mecanismo de recuperação de senha.
4. Atualizar este documento quando o fluxo do Miro ou os requisitos forem alterados.

> **Atenção:** o README atual ainda descreve comunicação entre funcionários e clientes. Isso diverge dos requisitos internos discutidos pela equipe (comunicação apenas entre funcionários) e precisa ser alinhado pelo PO antes de considerar a documentação funcional definitiva.
