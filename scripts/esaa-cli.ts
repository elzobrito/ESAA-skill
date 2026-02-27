import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { runProjection } from './esaa-projection';

// Garante que o diretório base seja o do projeto
const PROJECT_ROOT = process.cwd();
const ACTIVITY_LOG_PATH = path.resolve(PROJECT_ROOT, '.roadmap/activity.jsonl');

const EsaaAgentPayloadSchema = z.object({
  activity_event: z.object({
    action: z.enum(['claim', 'complete', 'review', 'issue.report']),
    task_id: z.string().min(1),
    notes: z.string().optional(),
    verification: z.object({ checks: z.array(z.string()).min(1) }).optional(),
    decision: z.enum(['approve', 'request_changes']).optional(),
    tasks: z.array(z.string()).optional(),
    issue_id: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    title: z.string().optional(),
    fixes: z.string().optional(),
    evidence: z.object({
      symptom: z.string(),
      repro_steps: z.array(z.string())
    }).optional()
  }).passthrough(),
  file_updates: z.array(z.object({
    path: z.string().min(1),
    content: z.string()
  })).optional()
});

function getNextSequence(): number {
  if (!fs.existsSync(ACTIVITY_LOG_PATH)) return 1;
  const content = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf-8').trim();
  if (!content) return 1;
  const lines = content.split('\n');
  const lastLine = lines[lines.length - 1];
  try {
    const lastEvent = JSON.parse(lastLine);
    return (lastEvent.event_seq || 0) + 1;
  } catch {
    return 1;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const payloadPath = args[0];
  if (!payloadPath) process.exit(1);

  try {
    const absolutePayloadPath = path.resolve(PROJECT_ROOT, payloadPath);
    if (!fs.existsSync(absolutePayloadPath)) throw new Error("Arquivo não encontrado.");
    
    const agentResult = JSON.parse(fs.readFileSync(absolutePayloadPath, 'utf-8'));
    const validated = EsaaAgentPayloadSchema.parse(agentResult);

    const nextSeq = getNextSequence();
    const esaaEvent = {
      schema_version: "0.4.0",
      event_id: `EV-${nextSeq.toString().padStart(8, '0')}`,
      event_seq: nextSeq,
      ts: new Date().toISOString(),
      actor: "agent-terminal",
      action: validated.activity_event.action,
      payload: validated
    };

    if (!fs.existsSync(path.dirname(ACTIVITY_LOG_PATH))) {
      fs.mkdirSync(path.dirname(ACTIVITY_LOG_PATH), { recursive: true });
    }

    const currentLog = fs.existsSync(ACTIVITY_LOG_PATH) ? fs.readFileSync(ACTIVITY_LOG_PATH, 'utf-8') : "";
    const needsNewline = currentLog.length > 0 && !currentLog.endsWith('\n');
    const entry = (needsNewline ? '\n' : '') + JSON.stringify(esaaEvent) + '\n';
    
    fs.appendFileSync(ACTIVITY_LOG_PATH, entry);
    console.log(`[ESAA OK] Evento ${esaaEvent.event_id} registrado.`);

    if (validated.file_updates) {
      validated.file_updates.forEach(file => {
        const filePath = path.resolve(PROJECT_ROOT, file.path);
        if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content);
      });
    }

    runProjection();
    if (fs.existsSync(absolutePayloadPath)) fs.unlinkSync(absolutePayloadPath);

  } catch (error: any) {
    console.error(`\n[ESAA REJEITADO] Erro:`);
    if (error instanceof z.ZodError) {
      // Correção da imagem: Zod usa .issues
      error.issues.forEach(e => console.error(` - ${e.path.join('.')}: ${e.message}`));
    } else {
      console.error(` - ${error.message}`);
    }
    process.exit(1);
  }
}

main();