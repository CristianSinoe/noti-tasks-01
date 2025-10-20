// apps/api/src/lib/schedule.ts
import { prisma } from './prisma';
import type { Task, $Enums } from '@prisma/client';

/**
 * Crea los eventos futuros de recordatorio para una tarea PENDING.
 * (T-24h, T-1h, T-5m y T)
 */
export async function createScheduleForTask(task: Task) {
  const now = new Date();
  const due = task.dueAt;

  // Slots que queremos programar
  const slots: Array<{ type: $Enums.NotificationType; when: Date }> = [
    { type: 'DUE_T24H', when: new Date(due.getTime() - 24 * 60 * 60 * 1000) },
    { type: 'DUE_T1H',  when: new Date(due.getTime() - 60 * 60 * 1000) },
    { type: 'DUE_T5M',  when: new Date(due.getTime() - 5 * 60 * 1000) },
    { type: 'DUE_NOW',  when: due },
  ];

  const data = slots
    .filter(s => s.when.getTime() > now.getTime()) // solo futuro
    .map(s => ({
      taskId: task.id,
      type: s.type,
      scheduledFor: s.when,
    }));

  if (data.length) {
    await prisma.notificationEvent.createMany({
      data,
      skipDuplicates: true, // evita duplicados si se reprograma rápido
    });
  }
}

/**
 * Cancela todos los eventos futuros no enviados de una tarea.
 * (Se usa al editar dueAt o al cambiar a SUBMITTED/DONE)
 */
export async function cancelFutureEvents(taskId: string) {
  const now = new Date();
  await prisma.notificationEvent.updateMany({
    where: {
      taskId,
      sentAt: null,
      canceledAt: null,
      scheduledFor: { gt: now },
    },
    data: { canceledAt: now },
  });
}
