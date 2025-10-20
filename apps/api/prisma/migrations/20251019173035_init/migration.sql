-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'DONE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'DUE_T24H', 'DUE_T1H', 'DUE_T5M', 'DUE_NOW');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "scheduledFor_utc" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tasks_dueAt" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "idx_tasks_status_dueAt" ON "Task"("status", "dueAt");

-- CreateIndex
CREATE INDEX "idx_events_scheduledFor" ON "NotificationEvent"("scheduledFor_utc");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_task_type_sched" ON "NotificationEvent"("taskId", "type", "scheduledFor_utc");

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
