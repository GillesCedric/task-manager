import { useDroppable }    from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation }  from 'react-i18next'
import { KanbanCard }      from './KanbanCard'
import { TaskStatus } from '@/types/task'
import type { Task }       from '@/types/task'

/**
 * @module components/tasks/KanbanColumn
 * @description Colonne droppable du tableau Kanban.
 *
 * useDroppable enregistre la colonne comme zone de dépôt valide.
 * SortableContext expose les items triables aux cartes enfants.
 * La couleur de fond change quand une carte survole la colonne (isOver).
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

/** @constant COLUMN_STYLES — Couleurs par statut pour les headers de colonnes */
const COLUMN_STYLES: Record<TaskStatus, { header: string; dot: string; count: string }> = {
  [TaskStatus.TODO]:        { header: 'border-slate-300 dark:border-slate-600', dot: 'bg-slate-400', count: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  [TaskStatus.IN_PROGRESS]: { header: 'border-blue-400 dark:border-blue-600',   dot: 'bg-blue-500',  count: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  [TaskStatus.DONE]:        { header: 'border-green-400 dark:border-green-600', dot: 'bg-green-500', count: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
}

interface KanbanColumnProps {
  status:     TaskStatus
  tasks:      Task[]
  onEdit:     (task: Task) => void
  onDelete:   (id: number) => void
  deletingId: number | null
}

/**
 * @function KanbanColumn
 * @description Colonne Kanban avec header coloré, compteur et zone de dépôt.
 *
 * @param {KanbanColumnProps} props
 * @returns {JSX.Element}
 */
export function KanbanColumn({ status, tasks, onEdit, onDelete, deletingId }: KanbanColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const styles = COLUMN_STYLES[status]

  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Header de colonne */}
      <div className={`flex items-center justify-between mb-3 pb-2.5 border-b-2 ${styles.header}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} aria-hidden />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            {t(`task.status.${status.toLowerCase()}`)}
          </h2>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.count}`}>
          {tasks.length}
        </span>
      </div>

      {/* Zone de dépôt */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 space-y-2.5 rounded-xl p-2 min-h-32 transition-colors duration-150',
          isOver
            ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700 ring-dashed'
            : 'bg-slate-50/50 dark:bg-slate-800/20',
        ].join(' ')}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={`animate-fade-in-up animation-delay-${Math.min(i + 1, 8)}`}
            >
              <KanbanCard
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                isDeleting={deletingId === task.id}
              />
            </div>
          ))}
        </SortableContext>

        {/* Placeholder colonne vide */}
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 text-xs text-slate-400 dark:text-slate-600 italic">
            {t('messages.noTasks')}
          </div>
        )}
      </div>
    </div>
  )
}