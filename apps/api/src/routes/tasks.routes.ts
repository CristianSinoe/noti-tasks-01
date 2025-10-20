// apps/api/src/routes/tasks.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { emitTaskEvent } from '../lib/notifications';
import { createScheduleForTask, cancelFutureEvents } from '../lib/schedule';
import type { Server } from 'socket.io';

export function tasksRouter(io: Server) {
  const r = Router();

  // Listado
  r.get('/', async (_req, res) => {
    const tasks = await prisma.task.findMany({ orderBy: { dueAt: 'asc' } });
    res.json(tasks);
  });

  // Detalle
  r.get('/:id', async (req, res) => {
    const t = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!t) return res.status(404).json({ error: 'No encontrada' });
    res.json(t);
  });

  // Crear  👈 ESTA ES LA QUE FALTABA
  r.post('/', async (req, res) => {
    const { title, description, dueAt } = req.body;
    if (!title || !dueAt) {
      return res.status(400).json({ error: 'title y dueAt son requeridos' });
    }

    const task = await prisma.task.create({
      data: { title, description, dueAt: new Date(dueAt) } // status por defecto: PENDING
    });

    // Programa recordatorios
    await createScheduleForTask(task);

    // Evento de creación
    emitTaskEvent(io, 'TASK_CREATED', task);

    res.status(201).json(task);
  });

  // Editar
  r.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { title, description, dueAt, status } = req.body;

    const prev = await prisma.task.findUnique({ where: { id } });
    if (!prev) return res.status(404).json({ error: 'No encontrada' });

    const nextDueAt = dueAt ? new Date(dueAt) : prev.dueAt;
    const nextStatus = status ?? prev.status;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title ?? prev.title,
        description: description ?? prev.description,
        dueAt: nextDueAt,
        status: nextStatus,
      },
    });

    // Reprogramación según cambios
    const dueChanged = prev.dueAt.getTime() !== nextDueAt.getTime();
    if (nextStatus !== 'PENDING') {
      await cancelFutureEvents(task.id);
    } else if (dueChanged) {
      await cancelFutureEvents(task.id);
      await createScheduleForTask(task);
    }

    emitTaskEvent(io, 'TASK_UPDATED', task);
    res.json(task);
  });

  // Eliminar (limpia hijos para evitar FK)
  r.delete('/:id', async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'No encontrada' });

    await cancelFutureEvents(task.id);

    await prisma.$transaction([
      prisma.notificationEvent.deleteMany({ where: { taskId: task.id } }),
      prisma.notification.deleteMany({ where: { taskId: task.id } }),
      prisma.task.delete({ where: { id: task.id } }),
    ]);

    emitTaskEvent(io, 'TASK_DELETED', task);
    res.json({ ok: true });
  });

  // Entregar
  r.post('/:id/submit', async (req, res) => {
    const id = req.params.id;

    const exists = await prisma.task.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'No encontrada' });

    const task = await prisma.task.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    await cancelFutureEvents(task.id);

    // Evento específico de entrega (no TASK_UPDATED)
    emitTaskEvent(io, 'TASK_SUBMITTED', task);

    res.json(task);
  });

  return r;
}
