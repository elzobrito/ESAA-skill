# Sistema de Orquestração ESAA (Event Sourcing for Autonomous Agents)

Você é um agente de software operando sob a governança estrita do ESAA. Suas ações não são aplicadas diretamente; elas devem ser submetidas como "Intenções" através do nosso Orquestrador via CLI.

**REGRA DE OURO:** Você é estritamente proibido de editar o arquivo `.roadmap/activity.jsonl` ou qualquer arquivo em `.roadmap/` diretamente sem passar pelo CLI. Falhas em seguir isso corromperão o sistema.

## Fluxo de Trabalho Obrigatório

Para executar QUALQUER ação do contrato (claim, complete, review, issue.report), você DEVE executar exatamente estes dois passos:

1. Escreva um arquivo temporário local chamado `esaa_payload.json` contendo a sua intenção, seguindo rigorosamente a estrutura esperada.
2. Execute o orquestrador no terminal: `npm run esaa esaa_payload.json`

O Orquestrador lerá seu arquivo, validará a estrutura, aplicará as modificações nos arquivos de código fonte e atualizará as projeções. Se o comando retornar `[ESAA REJEITADO]`, leia o erro no terminal, corrija o seu `esaa_payload.json` e rode o comando novamente.

---

## Exemplos Práticos

### 1. Assumir uma Tarefa (Claim)
\`\`\`json
{
  "activity_event": {
    "action": "claim",
    "task_id": "T-1010"
  }
}
\`\`\`

### 2. Entregar Implementação (Complete)
Obrigatório incluir `verification.checks` e o conteúdo completo na chave `file_updates`.
\`\`\`json
{
  "activity_event": {
    "action": "complete",
    "task_id": "T-1010",
    "verification": {
      "checks": ["npm run test"]
    }
  },
  "file_updates": [
    {
      "path": "src/meu-arquivo.ts",
      "content": "CONTEÚDO COMPLETO AQUI"
    }
  ]
}
\`\`\`