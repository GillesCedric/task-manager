import { z } from "zod";
import { TaskPriority, TaskStatus } from "@/types/task";

/**
 * @module schemas/taskSchemas
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, "Min 3 caractères.")
    .max(255)
    .transform((v) => v.trim()),
  description: z
    .string()
    .max(5000)
    .transform((v) => v.trim())
    .optional(),
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: "Statut invalide." }),
  }),
  priority: z.nativeEnum(TaskPriority, {
    errorMap: () => ({ message: "Priorité invalide." }),
  }),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD.")
    .optional()
    .or(z.literal("")),
  assignee_id: z.preprocess(
    (v) => { const n = Number(v); return (isNaN(n) || n <= 0) ? undefined : n; },
    z.number().positive().optional()
  ),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
