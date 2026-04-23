<?php

declare(strict_types=1);

namespace App\Interface;

use App\Entity\TaskList;
use App\Entity\TaskListMember;
use App\Entity\User;

/**
 * @interface TaskListServiceInterface
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
interface TaskListServiceInterface
{
    public function getAccessibleLists(User $user): array;
    public function getList(int $id, User $user): TaskList;
    public function createList(string $name, string $color, ?string $description, User $owner): TaskList;
    public function updateList(int $id, string $name, string $color, ?string $description, User $user): TaskList;
    public function deleteList(int $id, User $user): void;
    public function generateInviteLink(int $id, string $role, User $user): string;
    public function revokeInviteLink(int $id, User $user): void;
    public function joinByToken(string $token, User $user): TaskList;
    public function leaveList(int $id, User $user): void;
    public function updateMemberRole(int $listId, int $memberId, string $role, User $user): TaskListMember;
    public function removeMember(int $listId, int $memberId, User $user): void;
    public function canAccess(TaskList $list, User $user): bool;
    public function canEdit(TaskList $list, User $user): bool;
}
