import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const ACTIVITY_LOG_PATH = path.resolve(PROJECT_ROOT, '.roadmap/activity.jsonl');
const ROADMAP_PATH = path.resolve(PROJECT_ROOT, '.roadmap/roadmap.json');

export function runProjection() {
  if (!fs.existsSync(ACTIVITY_LOG_PATH)) return;

  const rawContent = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf-8').trim();
  if (!rawContent) return;

  const events = rawContent.split('\n')
    .filter(line => line.trim() !== "")
    .map(line => {
      try { return JSON.parse(line); } 
      catch { return null; }
    })
    .filter(ev => ev !== null);

  const roadmap = {
    meta: {
      schema_version: "0.4.0",
      esaa_version: "0.4.x",
      immutable_done: true,
      updated_at: new Date().toISOString()
    },
    tasks: [] as any[],
    indexes: { 
      by_status: { 
        todo: 0, 
        in_progress: 0, 
        review: 0, 
        done: 0 
      } 
    }
  };

  events.forEach(event => {
    const action = event.action;
    const payload = event.payload;

    if (action === 'task.create') {
      roadmap.tasks.push({
        task_id: payload.task_id,
        task_kind: payload.task_kind,
        title: payload.title,
        status: 'todo'
      });
    } else if (action === 'claim') {
      const task = roadmap.tasks.find((t: any) => t.task_id === payload.activity_event.task_id);
      if (task) { task.status = 'in_progress'; task.assigned_to = event.actor; }
    } else if (action === 'complete') {
      const task = roadmap.tasks.find((t: any) => t.task_id === payload.activity_event.task_id);
      if (task) task.status = 'review';
    } else if (action === 'review') {
      const decision = payload.activity_event.decision;
      const targetIds = payload.activity_event.tasks || [];
      targetIds.forEach((id: string) => {
        const task = roadmap.tasks.find((t: any) => t.task_id === id);
        if (task) {
          task.status = decision === 'approve' ? 'done' : 'in_progress';
          if (decision === 'approve') task.completed_at = event.ts;
        }
      });
    }
  });

  roadmap.tasks.forEach((task: any) => {
    // Correção da imagem: casting da chave para evitar erro de indexação any
    const status = task.status as keyof typeof roadmap.indexes.by_status;
    if (roadmap.indexes.by_status[status] !== undefined) {
      roadmap.indexes.by_status[status]++;
    }
  });

  fs.writeFileSync(ROADMAP_PATH, JSON.stringify(roadmap, null, 2));
  console.log(`[ESAA PROJEÇÃO] roadmap.json atualizado.`);
}