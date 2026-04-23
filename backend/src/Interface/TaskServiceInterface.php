<?php

declare(strict_types=1);

namespace App\Interface;

use App\DTO\CreateTaskDTO;
use App\DTO\PaginatedResult;
use App\DTO\UpdateTaskDTO;
use App\Entity\Task;
use App\Entity\User;

interface TaskServiceInterface
{
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
    ): PaginatedResult;

    public function getTaskById(int $id, User $user): Task;
    public function createTask(CreateTaskDTO $dto, User $user): Task;
    public function updateTask(int $id, UpdateTaskDTO $dto, User $user): Task;
    public function deleteTask(int $id, User $user): void;
    public function getStatistics(User $user): array;
}