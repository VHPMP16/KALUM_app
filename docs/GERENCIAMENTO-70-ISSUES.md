# Gerenciamento do projeto — Chat Corporativo Privado da Calunga

## Objetivo

Este documento registra a organização do trabalho do Chat Corporativo Privado da Calunga no repositório `otaviosferreira/chatapp`.

## Conjunto oficial de 70 Issues abertas

O conjunto oficial está distribuído em 10 Issues por responsabilidade:

| Responsável | Issues | Quantidade |
|---|---:|---:|
| Product Owner (PO) | #1–#10 | 10 |
| Desenvolvedor 1 | #11–#20 | 10 |
| Desenvolvedor 2 | #22–#31 | 10 |
| Desenvolvedor 3 | #32–#41 | 10 |
| Analista de SQA | #42–#51 | 10 |
| UX/UI Designer | #52–#61 | 10 |
| Tech Lead | #62–#71 | 10 |
| **Total de Issues abertas** | | **70** |

Acesse [todas as Issues abertas](https://github.com/otaviosferreira/chatapp/issues).

## Estrutura obrigatória de cada Issue

Cada Issue contém:
- Descrição e objetivo da atividade.
- Critérios de aceitação.
- Responsável funcional (cargo/função).
- Prioridade.
- Tipo de atividade.
- Status inicial: Backlog.
- Dependências.
- Labels sugeridas.
- Orientação para atualização contínua, evidências e vínculo com commits/Pull Requests.

## Fluxo de status

Utilizar o seguinte fluxo no GitHub Projects:
- Backlog — identificada, ainda não iniciada.
- To Do — planejada para execução.
- In Progress — em desenvolvimento.
- In Review — aguardando revisão.
- Testing — em validação/testes.
- Blocked — impedida por dependência ou problema.
- Done — concluída e validada.

Não marcar uma atividade como Done sem cumprir os critérios de aceitação e registrar evidências. Atualizar a Issue a cada avanço real, incluindo comentários, bloqueios, bugs, dependências e referências a commits/PRs.

## Regras de qualidade e rastreabilidade

1. Não criar tarefas genéricas ou sem relação com os requisitos do produto.
2. Não duplicar responsabilidades entre integrantes.
3. Relacionar commits e Pull Requests às Issues correspondentes, usando referências como `Closes #NUMERO` quando apropriado.
4. Manter as atividades de SQA acompanhando a implementação.
5. Preservar o histórico de mensagens e contas desabilitadas conforme os requisitos do produto.
6. Respeitar as restrições do produto: somente funcionários autorizados; sem cadastro público; sem usuários externos; anexos limitados a PDF/JPEG; sem áudio, vídeo, Excel ou Word; sem exclusão definitiva de contas.
7. Registrar progresso real; não presumir implementação ou validação concluída.

## Observações de configuração

- As 70 Issues oficiais estão abertas e com status inicial descrito como Backlog em seus corpos.
- As funções estão identificadas nos títulos e corpos. Os nomes de usuário GitHub dos integrantes ainda precisam ser informados para atribuição formal de assignees.
- As labels necessárias estão descritas em cada Issue como sugestões; elas ainda precisam ser criadas no repositório e aplicadas.
- O quadro GitHub Projects ainda precisa ser criado/vinculado e receber as 70 Issues. A integração disponível nesta execução permitiu criar e atualizar Issues, mas não criar ou configurar o Project board.
- Foram encerradas Issues adicionais geradas durante a preparação para manter exatamente 70 Issues abertas no conjunto oficial. O GitHub mantém Issues encerradas no histórico; portanto, a contagem total de registros (abertas + encerradas) é maior que 70. Não reabrir as Issues encerradas sem revisar a distribuição oficial.

## Requisitos do produto

A especificação funcional e não funcional do Chat Corporativo Privado da Calunga deve ser a referência para todas as atividades. Em caso de dúvida, priorizar segurança, controle administrativo, auditabilidade, preservação do histórico, LGPD e as restrições explícitas de funcionalidades proibidas.
