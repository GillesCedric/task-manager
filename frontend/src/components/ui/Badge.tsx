import { useTranslation } from "react-i18next";
import {
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
} from "@/types/task";

/**
 * @module components/ui/Badge
 * @description Badges de statut et priorité avec couleurs et traductions automatiques.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @function StatusBadge
 * @description Badge affichant le statut d'une tâche avec sa couleur correspondante.
 *
 * @param {{ status: TaskStatus }} props
 * @returns {JSX.Element}
 */
export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TASK_STATUS_COLORS[status]}`}
    >
      {t(`task.status.${status.toLowerCase()}`)}
    </span>
  );
}

/**
 * @function PriorityBadge
 * @description Badge affichant la priorité d'une tâche avec sa couleur correspondante.
 *
 * @param {{ priority: TaskPriority }} props
 * @returns {JSX.Element}
 */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TASK_PRIORITY_COLORS[priority]}`}
    >
      {t(`task.priority.${priority.toLowerCase()}`)}
    </span>
  );
}
