import { useForm }           from 'react-hook-form'
import { zodResolver }       from '@hookform/resolvers/zod'
import { useTranslation }    from 'react-i18next'
import { TaskPriority, TaskStatus } from '@/types/task'
import { createTaskSchema, type CreateTaskFormData } from '@/schemas/taskSchemas'
import { Button }   from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { useTaskList }  from '@/hooks/useTaskList'
import type { Task } from '@/types/task'

/**
 * @module components/tasks/TaskForm
 * @description Formulaire tâche — inclut la sélection d'assigné parmi les membres de la liste.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

interface TaskFormProps {
  onSubmit:       (data: CreateTaskFormData) => Promise<void>
  defaultValues?: Partial<Task>
  isLoading:      boolean
  activeListId:   number
}

/**
 * @function TaskForm
 * @param {TaskFormProps} props
 * @returns {JSX.Element}
 */
export function TaskForm({ onSubmit, defaultValues, isLoading, activeListId }: TaskFormProps) {
  const { t } = useTranslation()
  const { data: list } = useTaskList(activeListId)

  const members = list
    ? [
        { id: list.owner.id, name: list.owner.name },
        ...list.members.map(m => ({ id: m.user.id, name: m.user.name })),
      ]
    : []

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title:       defaultValues?.title       ?? '',
      description: defaultValues?.description ?? '',
      status:      defaultValues?.status      ?? TaskStatus.TODO,
      priority:    defaultValues?.priority    ?? TaskPriority.MEDIUM,
      due_date:    defaultValues?.dueDate?.slice(0, 10) ?? '',
      assignee_id: defaultValues?.assignee?.id ?? undefined,
    },
  })

  const handle = async (data: CreateTaskFormData) => {
    await onSubmit(data)
    if (!defaultValues) reset()
  }

  return (
    <form onSubmit={handleSubmit(handle)} noValidate className="space-y-4">
      <Input id="title" label={t('task.title')} required autoComplete="off"
        placeholder={t('task.titlePlaceholder')}
        error={errors.title?.message} {...register('title')} />

      <Textarea id="description" label={t('task.description')} rows={3}
        placeholder={t('task.descriptionPlaceholder')}
        error={errors.description?.message} {...register('description')} />

      <div className="grid grid-cols-2 gap-3">
        <Select id="status" label={t('task.status.status')} required error={errors.status?.message} {...register('status')}>
          <option value={TaskStatus.TODO}>{t('task.status.todo')}</option>
          <option value={TaskStatus.IN_PROGRESS}>{t('task.status.in_progress')}</option>
          <option value={TaskStatus.DONE}>{t('task.status.done')}</option>
        </Select>
        <Select id="priority" label={t('task.priority.priority')} required error={errors.priority?.message} {...register('priority')}>
          <option value={TaskPriority.LOW}>{t('task.priority.low')}</option>
          <option value={TaskPriority.MEDIUM}>{t('task.priority.medium')}</option>
          <option value={TaskPriority.HIGH}>{t('task.priority.high')}</option>
          <option value={TaskPriority.URGENT}>{t('task.priority.urgent')}</option>
        </Select>
      </div>

      <Input id="due_date" label={t('task.dueDate')} type="date"
        error={errors.due_date?.message} {...register('due_date')} />

      {members.length > 0 && (
        <Select id="assignee_id" label={t('task.assignee')} {...register('assignee_id', { valueAsNumber: true })}>
          <option value="">{t('task.unassigned')}</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      )}

      <Button type="submit" isLoading={isLoading} fullWidth>
        {defaultValues ? t('actions.save') : t('actions.create')}
      </Button>
    </form>
  )
}
