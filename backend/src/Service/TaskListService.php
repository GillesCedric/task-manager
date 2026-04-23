<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\TaskList;
use App\Entity\TaskListMember;
use App\Entity\User;
use App\Enum\TaskListRole;
use App\Interface\TaskListServiceInterface;
use App\Repository\TaskListMemberRepository;
use App\Repository\TaskListRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @class TaskListService
 * @description Logique métier des listes de tâches — création, partage, gestion membres.
 *
 * @package App\Service
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
final class TaskListService implements TaskListServiceInterface
{
    public function __construct(
        private readonly TaskListRepository       $listRepository,
        private readonly TaskListMemberRepository $memberRepository,
        private readonly NotificationService      $notificationService,
        private readonly AppLogger                $logger,
    ) {}

    /**
     * @method getAccessibleLists
     * @description Retourne toutes les listes accessibles pour un utilisateur.
     *
     * @param {User} $user
     * @returns {TaskList[]}
     */
    public function getAccessibleLists(User $user): array
    {
        return $this->listRepository->findAccessibleByUser($user);
    }

    /**
     * @method getList
     * @description Retourne une liste si l'utilisateur y a accès.
     *
     * @param {int}  $id
     * @param {User} $user
     * @returns {TaskList}
     */
    public function getList(int $id, User $user): TaskList
    {
        $list = $this->listRepository->find($id);
        if ($list === null) { throw new NotFoundHttpException("Liste #$id introuvable."); }
        if (!$this->canAccess($list, $user)) { throw new NotFoundHttpException("Liste #$id introuvable."); }
        return $list;
    }

    /**
     * @method createList
     * @description Crée une nouvelle liste de tâches.
     *
     * @param {string} $name
     * @param {string} $color
     * @param {string|null} $description
     * @param {User}   $owner
     * @returns {TaskList}
     */
    public function createList(string $name, string $color, ?string $description, User $owner): TaskList
    {
        $list = (new TaskList())
            ->setName($name)
            ->setColor($color)
            ->setDescription($description)
            ->setOwner($owner);

        $this->listRepository->save($list);

        $this->logger->action('tasklist.create',
            userId: $owner->getId(), userName: $owner->getName(),
            resourceType: 'tasklist', resourceId: $list->getId(),
            metadata: ['name' => $list->getName()],
        );

        return $list;
    }

    /**
     * @method updateList
     * @description Met à jour une liste (propriétaire uniquement).
     *
     * @param {int}         $id
     * @param {string}      $name
     * @param {string}      $color
     * @param {string|null} $description
     * @param {User}        $user
     * @returns {TaskList}
     */
    public function updateList(int $id, string $name, string $color, ?string $description, User $user): TaskList
    {
        $list = $this->getList($id, $user);
        $this->assertOwner($list, $user);

        $list->setName($name)->setColor($color)->setDescription($description);
        $this->listRepository->save($list);
        return $list;
    }

    /**
     * @method deleteList
     * @description Supprime une liste (propriétaire uniquement).
     *
     * @param {int}  $id
     * @param {User} $user
     */
    public function deleteList(int $id, User $user): void
    {
        $list = $this->getList($id, $user);
        $this->assertOwner($list, $user);
        $listName = $list->getName();
        $listId   = $list->getId();
        $this->listRepository->delete($list);

        $this->logger->action('tasklist.delete',
            userId: $user->getId(), userName: $user->getName(),
            resourceType: 'tasklist', resourceId: $listId,
            metadata: ['name' => $listName],
        );
    }

    /**
     * @method generateInviteLink
     * @description Génère ou régénère le lien d'invitation.
     *
     * @param {int}    $id
     * @param {string} $role Rôle par défaut (editor | reader)
     * @param {User}   $user
     * @returns {string} Le token d'invitation
     */
    public function generateInviteLink(int $id, string $role, User $user): string
    {
        $list = $this->getList($id, $user);
        $this->assertOwner($list, $user);

        $list->setDefaultInviteRole($role);
        $token = $list->generateInviteToken();
        $this->listRepository->save($list);

        return $token;
    }

    /**
     * @method revokeInviteLink
     * @description Révoque le lien d'invitation (les anciens liens cessent de fonctionner).
     *
     * @param {int}  $id
     * @param {User} $user
     */
    public function revokeInviteLink(int $id, User $user): void
    {
        $list = $this->getList($id, $user);
        $this->assertOwner($list, $user);
        $list->revokeInviteToken();
        $this->listRepository->save($list);
    }

    /**
     * @method joinByToken
     * @description Rejoint une liste via un token d'invitation.
     *
     * @param {string} $token
     * @param {User}   $user
     * @returns {TaskList}
     */
    public function joinByToken(string $token, User $user): TaskList
    {
        $list = $this->listRepository->findByInviteToken($token);
        if ($list === null) { throw new NotFoundHttpException('Lien d\'invitation invalide ou expiré.'); }

        // Déjà propriétaire
        if ($list->getOwner()?->getId() === $user->getId()) {
            return $list;
        }

        // Déjà membre
        if ($this->memberRepository->findMembership($list, $user) !== null) {
            return $list;
        }

        $member = (new TaskListMember())
            ->setTaskList($list)
            ->setUser($user)
            ->setRole($list->getDefaultInviteRole() ?? TaskListRole::READER->value);

        $this->memberRepository->save($member);
        $this->notificationService->notifyMemberJoined($user, $list);

        $this->logger->action('tasklist.join',
            userId: $user->getId(), userName: $user->getName(),
            resourceType: 'tasklist', resourceId: $list->getId(),
            metadata: ['name' => $list->getName(), 'role' => $member->getRole()],
        );

        return $list;
    }

    /**
     * @method leaveList
     * @description Quitte une liste (impossible pour le propriétaire).
     *
     * @param {int}  $id
     * @param {User} $user
     */
    public function leaveList(int $id, User $user): void
    {
        $list = $this->getList($id, $user);

        if ($list->getOwner()?->getId() === $user->getId()) {
            throw new AccessDeniedHttpException('Le propriétaire ne peut pas quitter sa propre liste. Supprimez-la à la place.');
        }

        $member = $this->memberRepository->findMembership($list, $user);
        if ($member === null) { throw new NotFoundHttpException('Vous n\'êtes pas membre de cette liste.'); }

        $this->notificationService->notifyMemberLeft($user, $list);
        $this->memberRepository->delete($member);
    }

    /**
     * @method updateMemberRole
     * @description Change le rôle d'un membre (propriétaire uniquement).
     *
     * @param {int}    $listId
     * @param {int}    $memberId
     * @param {string} $role
     * @param {User}   $user
     */
    public function updateMemberRole(int $listId, int $memberId, string $role, User $user): TaskListMember
    {
        $list   = $this->getList($listId, $user);
        $this->assertOwner($list, $user);

        $member = $this->memberRepository->find($memberId);
        if ($member === null || $member->getTaskList()?->getId() !== $listId) {
            throw new NotFoundHttpException('Membre introuvable.');
        }

        $member->setRole($role);
        $this->memberRepository->save($member);
        return $member;
    }

    /**
     * @method removeMember
     * @description Retire un membre d'une liste (propriétaire uniquement).
     *
     * @param {int}  $listId
     * @param {int}  $memberId
     * @param {User} $user
     */
    public function removeMember(int $listId, int $memberId, User $user): void
    {
        $list = $this->getList($listId, $user);
        $this->assertOwner($list, $user);

        $member = $this->memberRepository->find($memberId);
        if ($member === null || $member->getTaskList()?->getId() !== $listId) {
            throw new NotFoundHttpException('Membre introuvable.');
        }

        $this->memberRepository->delete($member);
    }

    /**
     * @method canAccess
     * @description Vérifie si un utilisateur peut accéder à une liste (owner ou member).
     *
     * @param {TaskList} $list
     * @param {User}     $user
     * @returns {bool}
     */
    public function canAccess(TaskList $list, User $user): bool
    {
        if ($list->getOwner()?->getId() === $user->getId()) { return true; }
        return $this->memberRepository->findMembership($list, $user) !== null;
    }

    /**
     * @method canEdit
     * @description Vérifie si un utilisateur peut modifier des tâches dans une liste.
     *
     * @param {TaskList} $list
     * @param {User}     $user
     * @returns {bool}
     */
    public function canEdit(TaskList $list, User $user): bool
    {
        if ($list->getOwner()?->getId() === $user->getId()) { return true; }
        $member = $this->memberRepository->findMembership($list, $user);
        return $member?->isEditor() ?? false;
    }

    /**
     * @method assertOwner
     * @description Lève une exception si l'utilisateur n'est pas propriétaire.
     *
     * @param {TaskList} $list
     * @param {User}     $user
     */
    private function assertOwner(TaskList $list, User $user): void
    {
        if ($list->getOwner()?->getId() !== $user->getId()) {
            throw new AccessDeniedHttpException('Seul le propriétaire peut effectuer cette action.');
        }
    }
}