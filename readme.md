# ESAA-skill: Event Sourcing for Autonomous Agents 🤖⛓️

Este repositório contém a implementação de referência da metodologia **ESAA (Event Sourcing for Autonomous Agents)**, um framework de governança e orquestração para agentes autônomos em engenharia de software baseada em LLMs.

Desenvolvido por **Elzo Brito**, este projeto aplica conceitos de **Sistemas de Informação** e **Arquitetura de Software** para garantir **auditabilidade total** e **imutabilidade** no ciclo de vida de agentes de IA.

## 🧠 Metodologia ESAA

Diferente de sistemas de chat tradicionais, o ESAA trata cada decisão do agente como um **evento imutável**.

- **Event Store:** Todas as ações são registradas em `.roadmap/activity.jsonl` com IDs sequenciais (monotônicos).
- **CQRS (Projeção):** O estado atual do projeto (`roadmap.json`) é reconstruído em tempo real a partir do log de eventos, garantindo que a "fonte da verdade" nunca seja corrompida.
- **Contratos Estritos:** Uso de **Zod** para validar payloads dos agentes antes da persistência, impedindo estados inválidos.

## 🛠️ Tecnologias

- **Node.js & TypeScript:** Core da CLI e lógica de projeção.
- **Zod:** Validação de esquemas e contratos de interface.
- **Python (Opcional):** Utilizado para scripts de suporte e implementação de lógica de agentes no framework PARCER.

## 🚀 Como Executar

### Pré-requisitos

- Node.js instalado.
- `npm install` para baixar as dependências (incluindo `tsx` para execução TypeScript).

### Comandos Principais

Para processar um resultado de agente (payload):

```bash
npm run esaa esaa_payload.json