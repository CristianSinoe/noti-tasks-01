-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationEvent" DROP CONSTRAINT "NotificationEvent_taskId_fkey";

-- DropIndex
DROP INDEX "public"."idx_tasks_dueAt";

-- DropIndex
DROP INDEX "public"."idx_tasks_status_dueAt";

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
