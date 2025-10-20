// apps/api/src/lib/notifications.ts
import type { Server } from 'socket.io';

/** =========================
 *  Tipos de dominio mínimos
 *  ========================= */
export type TaskStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'DONE';

export type TaskModel = {
  id: string;
  title: string;
  dueAt: Date;
  status: TaskStatus;
};

/** =========================
 *  Tipos de eventos del sistema
 *  ========================= */

// Eventos de TAREA (CRUD)
export type TaskEventType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_SUBMITTED';

// Recordatorios de tiempo (scheduler)
export type ReminderType =
  | 'DUE_T24H'
  | 'DUE_T1H'
  | 'DUE_T5M'
  | 'DUE_NOW';

/** =========================
 *  Emisores Socket.IO
 *  ========================= */

// Emite eventos de tarea (CRUD) a todos los clientes
export function emitTaskEvent(io: Server, type: TaskEventType, task: TaskModel) {
  io.emit('task:event', { type, task });
}

// Emite recordatorios (no-CRUD) a todos los clientes
export function emitReminder(io: Server, type: ReminderType, task: TaskModel) {
  io.emit('notification', {
    id: `${task.id}:${type}:${task.dueAt.toISOString()}`,
    type,
    title: 'Recordatorio',
    body: buildReminderMessage(type, task),
    taskId: task.id,
    dueAt: task.dueAt
  });
}

/** =========================
 *  Builders de mensajes
 *  ========================= */

// Mensajes legibles para recordatorios
export function buildReminderMessage(type: ReminderType, task: TaskModel) {
  switch (type) {
    case 'DUE_T24H': return `Falta 1 día para "${task.title}".`;
    case 'DUE_T1H':  return `Falta 1 hora para "${task.title}".`;
    case 'DUE_T5M':  return `Faltan 5 minutos para "${task.title}".`;
    case 'DUE_NOW':  return `¡Es la hora de entrega para "${task.title}"!`;
    default:         return `Recordatorio para "${task.title}".`;
  }
}
