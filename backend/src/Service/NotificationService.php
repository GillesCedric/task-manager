<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Notification;
use App\Entity\Task;
use App\Entity\TaskList;
use App\Entity\User;
use App\Enum\NotificationType;
use App\Repository\NotificationRepository;

/**
 * @class NotificationService
 * @description Crée et gère les notifications pour toutes les actions collaboratives.
 *
 * @package App\Service
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
final class NotificationService
{
    public function __construct(
        private readonly NotificationRepository $notificationRepository,
    ) {}

    /**
     * @method notifyInvite
     * @description Notifie un utilisateur qu'il a été invité dans une liste.
     *
     * @param {User}     $recipient
     * @param {User}     $actor
     * @param {TaskList} $list
     * @param {string}   $role
     */
    public function notifyInvite(User $recipient, User $actor, TaskList $list, string $role): void
    {
        $this->create($recipient, $actor, NotificationType::TYPE_INVITE->value, [
            'list_id'   => $list->getId(),
            'list_name' => $list->getName(),
            'role'      => $role,
        ]);
    }

    /**
     * @method notifyTaskAssigned
     * @description Notifie un utilisateur qu'une tâche lui a été assignée.
     *
     * @param {User} $assignee
     * @param {User} $actor
     * @param {Task} $task
     */
    public function notifyTaskAssigned(User $assignee, User $actor, Task $task): void
    {
        if ($assignee->getId() === $actor->getId()) { return; }

        $this->create($assignee, $actor, NotificationType::TYPE_TASK_ASSIGNED->value, [
            'task_id'   => $task->getId(),
            'task_title'=> $task->getTitle(),
            'list_id'   => $task->getTaskList()?->getId(),
            'list_name' => $task->getTaskList()?->getName(),
        ]);
    }

    /**
     * @method notifyTaskUpdated
     * @description Notifie les membres d'une liste partagée d'une mise à jour de tâche.
     *
     * @param {User}   $actor
     * @param {Task}   $task
     * @param {string} $change Description courte du changement
     */
    public function notifyTaskUpdated(User $actor, Task $task, string $change): void
    {
        $list = $task->getTaskList();
        if ($list === null) { return; }

        $recipients = $this->getListRecipients($list, $actor);

        foreach ($recipients as $recipient) {
            $this->create($recipient, $actor, NotificationType::TYPE_TASK_UPDATED->value, [
                'task_id'   => $task->getId(),
                'task_title'=> $task->getTitle(),
                'list_id'   => $list->getId(),
                'list_name' => $list->getName(),
                'change'    => $change,
            ]);
        }
    }

    /**
     * @method notifyMemberJoined
     * @description Notifie le propriétaire d'une liste qu'un membre vient de rejoindre.
     *
     * @param {User}     $newMember
     * @param {TaskList} $list
     */
    public function notifyMemberJoined(User $newMember, TaskList $list): void
    {
        $owner = $list->getOwner();
        if ($owner === null || $owner->getId() === $newMember->getId()) { return; }

        $this->create($owner, $newMember, NotificationType::TYPE_MEMBER_JOINED->value, [
            'list_id'   => $list->getId(),
            'list_name' => $list->getName(),
        ]);
    }

    /**
     * @method notifyMemberLeft
     * @description Notifie le propriétaire qu'un membre a quitté la liste.
     *
     * @param {User}     $member
     * @param {TaskList} $list
     */
    public function notifyMemberLeft(User $member, TaskList $list): void
    {
        $owner = $list->getOwner();
        if ($owner === null || $owner->getId() === $member->getId()) { return; }

        $this->create($owner, $member, NotificationType::TYPE_MEMBER_LEFT->value, [
            'list_id'   => $list->getId(),
            'list_name' => $list->getName(),
        ]);
    }

    /**
     * @method getListRecipients
     * @description Retourne tous les membres d'une liste sauf l'acteur (pour éviter les auto-notifs).
     *
     * @param {TaskList} $list
     * @param {User}     $actor
     * @returns {User[]}
     */
    private function getListRecipients(TaskList $list, User $actor): array
    {
        $recipients = [];

        $owner = $list->getOwner();
        if ($owner && $owner->getId() !== $actor->getId()) {
            $recipients[] = $owner;
        }

        foreach ($list->getMembers() as $member) {
            $user = $member->getUser();
            if ($user && $user->getId() !== $actor->getId()) {
                $recipients[] = $user;
            }
        }

        return $recipients;
    }

    /**
     * @method create
     * @param {User}   $recipient
     * @param {User}   $actor
     * @param {string} $type
     * @param {array}  $payload
     */
    private function create(User $recipient, User $actor, string $type, array $payload): void
    {
        $notif = (new Notification())
            ->setRecipient($recipient)
            ->setActor($actor)
            ->setType($type)
            ->setPayload($payload);

        $this->notificationRepository->save($notif, false);
        $this->notificationRepository->getEntityManager()->flush();
    }
}