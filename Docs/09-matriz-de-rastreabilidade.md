# 9. Matriz de rastreabilidade

A matriz relaciona os requisitos funcionais com casos de uso e critérios de aceitação. Requisitos não funcionais e regras de negócio complementam a validação transversal.

| Requisitos | Caso(s) de uso | Critério(s) |
|---|---|---|
| RF-001 a RF-005 | UC-001 | CA-001 a CA-004 |
| RF-006, RF-007 | UC-002 | CA-005 |
| RF-008 a RF-010, RF-012 | UC-003 | CA-006, CA-007 |
| RF-011 | UC-004 | CA-008 |
| RF-013 a RF-015 | UC-005 | CA-009 |
| RF-016 a RF-018 | UC-010 | CA-010 |
| RF-019 a RF-021 | UC-006 | CA-011, CA-012 |
| RF-022 a RF-028 | UC-006, UC-007 | CA-013, CA-014 |
| RF-029, RF-030 | UC-006 | CA-015 |
| RF-031, RF-032 | UC-006 | CA-016 |
| RF-033 | UC-007 | CA-017 |
| RF-034 a RF-036 | UC-007 | CA-018, CA-019 |
| RF-037 a RF-041 | UC-008 | CA-020 a CA-022 |
| RF-042, RF-043 | UC-008, UC-011 | CA-023 |
| RF-044 a RF-047 | UC-009 | CA-024 |
| RF-048 a RF-050 | UC-011, UC-012 | CA-025 |
| RF-051, RF-052 | UC-003, UC-004, UC-011, UC-012, UC-013 | CA-026 |
| RF-053 | UC-001, UC-004, UC-011, UC-012 | CA-027 |
| RF-054 | UC-012 | CA-028 |
| RF-055 | UC-011 | CA-029 |
| RF-056 | UC-012 | CA-029 |
| RF-057 | UC-013 | CA-030 |

## Rastreabilidade não funcional

| Requisitos não funcionais | Critério(s) |
|---|---|
| RNF-001, RNF-002 | CA-031 |
| RNF-003 a RNF-008 | CA-003, CA-004, CA-008, CA-025 a CA-029 |
| RNF-009 a RNF-017 | CA-010, CA-016, CA-024, CA-032 |
| RNF-018 a RNF-022 | CA-033 |
| RNF-023 a RNF-026 | CA-018, CA-019, CA-034 |

## Regras de negócio transversais

As regras RN-001 a RN-036 devem ser consideradas durante a implementação e revisão dos casos de uso. Em especial, RN-004 a RN-012 restringem elegibilidade, conversas e retenção; RN-026 a RN-035 definem segregação de funções e auditoria.

## Controle de mudanças

Quando um requisito for alterado:
1. preservar o identificador se a intenção permanecer a mesma;
2. criar novo identificador se houver mudança material de comportamento;
3. revisar casos de uso e critérios associados;
4. atualizar esta matriz;
5. registrar aprovação do Product Owner e impacto técnico.
