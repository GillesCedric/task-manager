import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import toast from "react-hot-toast";
import { Plus, RefreshCw, LayoutGrid } from "lucide-react";
import { KanbanColumn }   from "./KanbanColumn";
import { KanbanCard }     from "./KanbanCard";
import { TaskForm }       from "./TaskForm";
import { TaskFiltersBar } from "./TaskFilters";
import { Modal }          from "@/components/ui/Modal";
import { Button }         from "@/components/ui/Button";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/useTask";
import { TaskStatus } from "@/types/task";
import type { Task, TaskFilters } from "@/types/task";
import type { TaskListSummary } from "@/types/taskList";
import type { CreateTaskFormData } from "@/schemas/taskSchemas";

/**
 * @module components/tasks/KanbanBoard
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

const COLUMNS = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE] as const;

const DEFAULT_FILTERS: Omit<TaskFilters, 'listId'> = {
  page: 1, perPage: 100, sort: 'priority', order: 'DESC',
};

interface KanbanBoardProps {
  activeList: TaskListSummary | null;
}

export function KanbanBoard({ activeList }: KanbanBoardProps) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<TaskFilters>({
    ...DEFAULT_FILTERS,
    listId: activeList?.id,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask,   setEditTask]   = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Reset all filters when the active list changes
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS, listId: activeList?.id });
  }, [activeList?.id]);

  const { data, isLoading, isError, refetch } = useTasks({
    ...filters,
    listId: activeList?.id,
  });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const allTasks = data?.tasks ?? [];

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [], [TaskStatus.IN_PROGRESS]: [], [TaskStatus.DONE]: [],
    };
    allTasks.forEach((t) => { map[t.status]?.push(t); });
    return map;
  }, [allTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = (event.active.data.current as { task: Task })?.task;
    if (task) setActiveTask(task);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !active) return;

    const draggedTask = (active.data.current as { task: Task })?.task;
    if (!draggedTask) return;

    const newStatus = Object.values(TaskStatus).includes(over.id as TaskStatus)
      ? (over.id as TaskStatus)
      : (over.data.current as { task?: Task })?.task?.status;

    if (!newStatus || newStatus === draggedTask.status) return;

    try {
      await updateTask.mutateAsync({ id: draggedTask.id, payload: { status: newStatus } });
    } catch {
      toast.error(t("messages.error"));
    }
  }, [updateTask, t]);

  const handleCreate = async (fd: CreateTaskFormData) => {
    if (!activeList) return;
    await createTask.mutateAsync({
      title:       fd.title,
      list_id:     activeList.id,
      description: fd.description,
      status:      fd.status,
      priority:    fd.priority,
      due_date:    fd.due_date || undefined,
      assignee_id: fd.assignee_id,
    });
    toast.success(t("messages.taskCreated"));
    setCreateOpen(false);
  };

  const handleUpdate = async (fd: CreateTaskFormData) => {
    if (!editTask) return;
    await updateTask.mutateAsync({
      id:      editTask.id,
      payload: {
        title:       fd.title,
        description: fd.description,
        status:      fd.status,
        priority:    fd.priority,
        due_date:    fd.due_date || null,
        assignee_id: fd.assignee_id,
      },
    });
    toast.success(t("messages.taskUpdated"));
    setEditTask(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("messages.confirmDelete"))) return;
    setDeletingId(id);
    try {
      await deleteTask.mutateAsync(id);
      toast.success(t("messages.taskDeleted"));
    } finally {
      setDeletingId(null);
    }
  };

  if (!activeList) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 gap-3">
        <LayoutGrid size={40} className="opacity-30" />
        <p className="text-sm">{t("list.selectOrCreate")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête liste + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeList.color }} />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{activeList.name}</h1>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            — {t("task.taskCount", { count: allTasks.length })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} aria-label={t("actions.refresh")}>
            <RefreshCw size={14} />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> {t("actions.create")}
          </Button>
        </div>
      </div>

      {/* Barre de filtres complète */}
      <TaskFiltersBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} />

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center h-32 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 text-sm" role="alert">
          {t("messages.error")}
        </div>
      )}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onEdit={setEditTask}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            duration: 260,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
          }}>
            {activeTask && (
              <div className="rotate-1 scale-105">
                <KanbanCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isDeleting={false} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t("actions.create")}>
        <TaskForm onSubmit={handleCreate} isLoading={createTask.isPending} activeListId={activeList.id} />
      </Modal>
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title={t("actions.edit")}>
        {editTask && (
          <TaskForm
            onSubmit={handleUpdate}
            defaultValues={editTask}
            isLoading={updateTask.isPending}
            activeListId={activeList.id}
          />
        )}
      </Modal>
    </div>
  );
}
