import { useState }        from 'react'
import { useTranslation }  from 'react-i18next'
import { Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle, Calendar } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Button }          from '@/components/ui/Button'
import { formatRelative, isOverdue } from '@/utils/date'
import type { Task }       from '@/types/task'

/**
 * @module components/tasks/TaskCard
 * @description Carte représentant une tâche dans la liste avec expand/collapse.
 *
 * React échappe automatiquement le contenu JSX — pas besoin de sanitiser à l'affichage.
 * Les dates sont formatées en temps relatif pour plus de lisibilité ("il y a 2h").
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

interface TaskCardProps {
  task:       Task
  onEdit:     (task: Task) => void
  onDelete:   (id: number) => void
  isDeleting: boolean
}

/**
 * @function TaskCard
 * @description Carte de tâche avec badges statut/priorité, date d'échéance et actions.
 *
 * @param {TaskCardProps} props
 * @returns {JSX.Element}
 */
export function TaskCard({ task, onEdit, onDelete, isDeleting }: TaskCardProps) {
  const { t, i18n }  = useTranslation()
  const [open, setOpen] = useState(false)
  const overdue = isOverdue(task.dueDate)

  return (
    <article
      className={[
        'bg-white dark:bg-slate-800 rounded-xl border shadow-sm hover:shadow-md transition-all p-4',
        overdue
          ? 'border-red-300 dark:border-red-700'
          : 'border-slate-200 dark:border-slate-700',
      ].join(' ')}
      aria-label={`Tâche : ${task.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{task.title}</h3>
            {overdue && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle size={12} />{t('task.overdue')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {formatRelative(task.createdAt, i18n.language)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <StatusBadge   status={task.status} />
          <PriorityBadge priority={task.priority} />
          <button onClick={() => setOpen(v => !v)} aria-expanded={open}
            aria-label={open ? 'Réduire' : 'Développer'}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors ml-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
          {task.description
            ? <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description}</p>
            : <p className="text-sm text-slate-400 italic">{t('task.noDescription')}</p>
          }

          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar size={13} />
              <span>{t('task.dueDate')} : {task.dueDate.slice(0, 10)}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="flex-1">
              <Pencil size={13} />{t('actions.edit')}
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(task.id)}
              isLoading={isDeleting} className="flex-1">
              <Trash2 size={13} />{t('actions.delete')}
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
