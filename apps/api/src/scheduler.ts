// apps/api/src/scheduler.ts
import cron from 'node-cron';
import { prisma } from './lib/prisma';
import {
  emitReminder,
  buildReminderMessage,
  ReminderType,
  TaskModel,
  TaskStatus,
} from './lib/notifications';
import type { Server } from 'socket.io';

export function startScheduler(io: Server) {
  // Catch-up al arrancar (por si el server estuvo caído)
  processDue(io).catch(console.error);

  // Corre cada minuto
  cron.schedule('* * * * *', async () => {
    await processDue(io).catch(console.error);
  });
}

async function processDue(io: Server) {
  const now = new Date();

  // Buscar eventos vencidos no enviados ni cancelados
  const events = await prisma.notificationEvent.findMany({
    where: {
      scheduledFor: { lte: now },
      sentAt: null,
      canceledAt: null,
    },
    include: { task: true },
    orderBy: { scheduledFor: 'asc' },
  });

  for (const ev of events) {
    // Si la tarea ya fue entregada/DONE, omite recordatorios
    if (ev.task.status === 'SUBMITTED' || ev.task.status === 'DONE') {
      await prisma.notificationEvent.update({
        where: { id: ev.id },
        data: { sentAt: now },
      });
      continue;
    }

    // Construimos el "TaskModel" mínimo que usan los notifiers
    const task: TaskModel = {
      id: ev.task.id,
      title: ev.task.title,
      dueAt: ev.task.dueAt,
      status: ev.task.status as TaskStatus,
    };

    // Guarda histórico
    const message = buildReminderMessage(ev.type as ReminderType, task);
    await prisma.notification.create({
      data: {
        taskId: ev.taskId,
        type: ev.type, // Prisma ya tipa ev.type como su enum
        message,
      },
    });

    // Emite a los clientes conectados (Socket.IO)
    emitReminder(io, ev.type as ReminderType, task);

    // Marca el evento como enviado (idempotencia)
    await prisma.notificationEvent.update({
      where: { id: ev.id },
      data: { sentAt: now },
    });
  }
}
