<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\CreateTaskDTO;
use App\DTO\PaginatedResult;
use App\DTO\UpdateTaskDTO;
use App\Entity\Task;
use App\Entity\TaskList;
use App\Entity\User;
use App\Enum\TaskPriority;
use App\Enum\TaskStatus;
use App\Interface\TaskRepositoryInterface;
use App\Interface\TaskServiceInterface;
use App\Repository\UserRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @class TaskService
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
final class TaskService implements TaskServiceInterface
{
    public function __construct(
        private readonly TaskRepositoryInterface $taskRepository,
        private readonly TaskCacheService        $cacheService,
        private readonly TaskListService         $listService,
        private readonly NotificationService     $notificationService,
        private readonly UserRepository          $userRepository,
        private readonly AppLogger               $logger,
    ) {}

    public function getTasks(
        User    $user,
        int     $page     = 1,
        int     $perPage  = 10,
        ?string $status   = null,
        ?string $priority = null,
        ?string $search   = null,
        string  $sort     = 'createdAt',
        string  $order    = 'DESC',
        ?int    $listId   = null,
    ): PaginatedResult {
        $perPage = min(max(1, $perPage), 100);
        $page    = max(1, $page);

        if ($listId !== null) {
            $this->listService->getList($listId, $user);
        }

        $cacheKey = $this->cacheService->buildListKey(
            $user->getId(), $page, $perPage, $status, $priority, $search, $sort, $order
        ) . "_list{$listId}";

        return $this->cacheService->getTaskList($cacheKey, $user->getId(), function () use (
            $page, $perPage, $user, $status, $priority, $search, $sort, $order, $listId
        ): PaginatedResult {
            ['items' => $items, 'total' => $total] = $this->taskRepository->findPaginated(
                $page, $perPage, $user->getId(), $status, $priority, $search, $sort, $order, $listId
            );
            $totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
            return new PaginatedResult($items, $total, $page, $perPage, $totalPages);
        });
    }

    public function getTaskById(int $id, User $user): Task
    {
        $task = $this->taskRepository->findById($id);
        if ($task === null) {
            throw new NotFoundHttpException("Tâche #$id introuvable.");
        }

        $list = $task->getTaskList();
        if ($list === null || !$this->listService->canAccess($list, $user)) {
            throw new NotFoundHttpException("Tâche #$id introuvable.");
        }

        return $task;
    }

    public function createTask(CreateTaskDTO $dto, User $user): Task
    {
        $list = $this->listService->getList($dto->listId, $user);
        if (!$this->listService->canEdit($list, $user)) {
            $this->logger->security('task.create_denied', ['list_id' => $dto->listId], $user->getId(), $user->getName());
            throw new AccessDeniedHttpException('Droits insuffisants pour créer des tâches dans cette liste.');
        }

        $started = hrtime(true);

        $task = (new Task())
            ->setTitle($dto->title)
            ->setDescription($dto->description)
            ->setStatus(TaskStatus::from($dto->status))
            ->setPriority(TaskPriority::from($dto->priority))
            ->setDueDate($dto->dueDate)
            ->setTaskList($list)
            ->setOwner($user);

        if ($dto->assigneeId !== null) {
            $assignee = $this->userRepository->find($dto->assigneeId);
            if ($assignee) {
                $task->setAssignee($assignee);
                $this->notificationService->notifyTaskAssigned($assignee, $user, $task);
            }
        }

        $this->taskRepository->save($task);
        $this->cacheService->invalidateUserCache($user->getId());

        $durationMs = (int) ((hrtime(true) - $started) / 1_000_000);
        $this->logger->action('task.create',
            userId: $user->getId(),
            userName: $user->getName(),
            resourceType: 'task',
            resourceId: $task->getId(),
            metadata: ['title' => $task->getTitle(), 'list_id' => $dto->listId, 'priority' => $dto->priority],
            durationMs: $durationMs,
        );

        return $task;
    }

    public function updateTask(int $id, UpdateTaskDTO $dto, User $user): Task
    {
        $task = $this->getTaskById($id, $user);
        $list = $task->getTaskList();

        if (!$this->listService->canEdit($list, $user)) {
            $this->logger->security('task.update_denied', ['task_id' => $id], $user->getId(), $user->getName());
            throw new AccessDeniedHttpException('Droits insuffisants pour modifier cette tâche.');
        }

        $diff = [];
        $oldStatus = $task->getStatus()->value;

        if ($dto->title       !== null) { $diff['title']    = ['from' => $task->getTitle(),             'to' => $dto->title];          $task->setTitle($dto->title); }
        if ($dto->description !== null) { $task->setDescription($dto->description); }
        if ($dto->status      !== null) { $diff['status']   = ['from' => $task->getStatus()->value,    'to' => $dto->status];   $task->setStatus(TaskStatus::from($dto->status)); }
        if ($dto->priority    !== null) { $diff['priority'] = ['from' => $task->getPriority()->value,  'to' => $dto->priority]; $task->setPriority(TaskPriority::from($dto->priority)); }
        if ($dto->dueDate     !== null) { $task->setDueDate($dto->dueDate); }

        if ($dto->assigneeProvided) {
            if ($dto->assigneeId === null) {
                $task->setAssignee(null);
            } else {
                $assignee = $this->userRepository->find($dto->assigneeId);
                if ($assignee) {
                    $task->setAssignee($assignee);
                    $this->notificationService->notifyTaskAssigned($assignee, $user, $task);
                }
            }
        }

        $this->taskRepository->save($task);

        if ($dto->status !== null && $dto->status !== $oldStatus) {
            $this->notificationService->notifyTaskUpdated($user, $task, "statut → {$dto->status}");
        }

        $this->cacheService->invalidateUserCache($user->getId());

        if (!empty($diff)) {
            $this->logger->action('task.update',
                userId: $user->getId(),
                userName: $user->getName(),
                resourceType: 'task',
                resourceId: $task->getId(),
                metadata: ['changes' => $diff],
            );
        }

        return $task;
    }

    public function deleteTask(int $id, User $user): void
    {
        $task = $this->getTaskById($id, $user);
        $list = $task->getTaskList();

        if (!$this->listService->canEdit($list, $user)) {
            $this->logger->security('task.delete_denied', ['task_id' => $id], $user->getId(), $user->getName());
            throw new AccessDeniedHttpException('Droits insuffisants pour supprimer cette tâche.');
        }

        $taskTitle  = $task->getTitle();
        $listId     = $list?->getId();

        $this->taskRepository->delete($task);
        $this->cacheService->invalidateUserCache($user->getId());

        $this->logger->action('task.delete',
            userId: $user->getId(),
            userName: $user->getName(),
            resourceType: 'task',
            resourceId: $id,
            metadata: ['title' => $taskTitle, 'list_id' => $listId],
        );
    }

    public function getStatistics(User $user): array
    {
        return $this->cacheService->getStats(
            $user->getId(),
            fn() => $this->taskRepository->getStatsByOwner($user->getId())
        );
    }
}
