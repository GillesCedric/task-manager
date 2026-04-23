import { useSortable }    from '@dnd-kit/sortable'
import { CSS }            from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { useState }       from 'react'
import { Pencil, Trash2, Calendar, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar }         from '@/components/ui/Avatar'
import { Button }         from '@/components/ui/Button'
import { formatRelative, isOverdue } from '@/utils/date'
import { TaskPriority }   from '@/types/task'
import type { Task }      from '@/types/task'

/**
 * @module components/tasks/KanbanCard
 * @description Carte de tâche draggable — poignée pleine hauteur, indicateur priorité, assigné.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.2.0
 */

interface KanbanCardProps {
  task:       Task
  onEdit:     (task: Task) => void
  onDelete:   (id: number) => void
  isDeleting: boolean
}

const PRIORITY_STRIP: Record<TaskPriority, string> = {
  [TaskPriority.LOW]:    'bg-slate-300 dark:bg-slate-600',
  [TaskPriority.MEDIUM]: 'bg-yellow-400 dark:bg-yellow-500',
  [TaskPriority.HIGH]:   'bg-orange-400 dark:bg-orange-500',
  [TaskPriority.URGENT]: 'bg-red-500',
}

const PRIORITY_LABEL_COLOR: Record<TaskPriority, string> = {
  [TaskPriority.LOW]:    'text-slate-400 dark:text-slate-500',
  [TaskPriority.MEDIUM]: 'text-yellow-600 dark:text-yellow-400',
  [TaskPriority.HIGH]:   'text-orange-500 dark:text-orange-400',
  [TaskPriority.URGENT]: 'text-red-500',
}

/**
 * @function KanbanCard
 * @param {KanbanCardProps} props
 * @returns {JSX.Element}
 */
export function KanbanCard({ task, onEdit, onDelete, isDeleting }: KanbanCardProps) {
  const { t, i18n }    = useTranslation()
  const [open, setOpen] = useState(false)
  const overdue         = isOverdue(task.dueDate)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } })

  const style = {
    transform:   CSS.Transform.toString(transform),
    transition:  isDragging ? 'opacity 150ms ease' : transition,
    opacity:     isDragging ? 0.35 : 1,
    zIndex:      isDragging ? 999 : undefined,
    willChange:  isDragging ? 'transform' : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex rounded-xl border bg-white dark:bg-slate-800 shadow-sm overflow-hidden select-none',
        'transition-shadow duration-150',
        overdue
          ? 'border-red-200 dark:border-red-800'
          : 'border-slate-200 dark:border-slate-700',
        isDragging
          ? 'shadow-2xl ring-2 ring-blue-400 dark:ring-blue-500'
          : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
      ].join(' ')}
    >
      {/* Poignée drag — pleine hauteur */}
      <button
        {...attributes}
        {...listeners}
        className={[
          'w-6 shrink-0 flex items-center justify-center',
          'bg-slate-50 dark:bg-slate-700/40',
          'hover:bg-slate-100 dark:hover:bg-slate-700',
          'border-r border-slate-100 dark:border-slate-700',
          'cursor-grab active:cursor-grabbing transition-colors group/grip',
        ].join(' ')}
        aria-label={t('task.drag', { defaultValue: 'Déplacer' })}
        tabIndex={-1}
      >
        <GripVertical
          size={12}
          className="text-slate-300 group-hover/grip:text-slate-500 dark:text-slate-600 dark:group-hover/grip:text-slate-400 transition-colors"
        />
      </button>

      {/* Bande priorité */}
      <div className={`w-1 shrink-0 ${PRIORITY_STRIP[task.priority]}`} />

      {/* Contenu */}
      <div className="flex-1 min-w-0 p-3 space-y-2">

        {/* Ligne titre + assigné */}
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex-1 min-w-0 text-left group/title"
          >
            <h3 className={[
              'text-sm font-semibold leading-snug line-clamp-2',
              'text-slate-900 dark:text-white',
              'group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400',
              'transition-colors',
              overdue ? 'text-red-700 dark:text-red-300' : '',
            ].join(' ')}>
              {task.title}
            </h3>
          </button>

          {/* Avatar assigné */}
          {task.assignee && (
            <div className="shrink-0" title={task.assignee.name}>
              <Avatar user={task.assignee} size="sm" />
            </div>
          )}
        </div>

        {/* Méta : priorité + échéance + expand toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priorité */}
          <span className={`text-xs font-semibold uppercase tracking-wide ${PRIORITY_LABEL_COLOR[task.priority]}`}>
            {t(`task.priority.${task.priority.toLowerCase()}`)}
          </span>

          {/* Date d'échéance */}
          {task.dueDate && (
            <span className={[
              'inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5',
              overdue
                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
            ].join(' ')}>
              <Calendar size={10} />
              {task.dueDate.slice(0, 10)}
            </span>
          )}

          {/* Timestamp création */}
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 shrink-0">
            {formatRelative(task.createdAt, i18n.language)}
          </span>

          {/* Expand toggle */}
          <button
            onClick={() => setOpen(v => !v)}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            aria-label={open ? 'Réduire' : 'Développer'}
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Détails dépliables */}
        {open && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3 animate-fade-in-up">
            {/* Description */}
            {task.description ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                {t('task.noDescription')}
              </p>
            )}

            {/* Assigné étendu */}
            {task.assignee && (
              <div className="flex items-center gap-2">
                <Avatar user={task.assignee} size="sm" />
                <span className="text-xs text-slate-500 dark:text-slate-400">{task.assignee.name}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="flex-1 text-xs">
                <Pencil size={11} /> {t('actions.edit')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(task.id)} isLoading={isDeleting} className="flex-1 text-xs">
                <Trash2 size={11} /> {t('actions.delete')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
