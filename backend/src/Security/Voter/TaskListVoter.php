<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\TaskList;
use App\Entity\User;
use App\Repository\TaskListMemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @class TaskListVoter
 * @description Politique RBAC pour les listes de tâches.
 *
 * Matrice de droits :
 *   VIEW   → propriétaire OU membre (lecture ou éditeur)
 *   EDIT   → propriétaire OU membre EDITOR
 *   MANAGE → propriétaire uniquement (suppression, invitations, membres)
 *
 * Utilisation dans les controllers :
 *   $this->denyAccessUnlessGranted(TaskListVoter::VIEW, $list);
 *
 * @package App\Security\Voter
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 * @extends Voter<string, TaskList>
 */
final class TaskListVoter extends Voter
{
    public const VIEW   = 'TASKLIST_VIEW';
    public const EDIT   = 'TASKLIST_EDIT';
    public const MANAGE = 'TASKLIST_MANAGE';

    public function __construct(
        private readonly TaskListMemberRepository $memberRepository,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::MANAGE], true)
            && $subject instanceof TaskList;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var TaskList $list */
        $list = $subject;

        return match ($attribute) {
            self::VIEW   => $this->canView($list, $user),
            self::EDIT   => $this->canEdit($list, $user),
            self::MANAGE => $this->isOwner($list, $user),
            default      => false,
        };
    }

    private function isOwner(TaskList $list, User $user): bool
    {
        return $list->getOwner()?->getId() === $user->getId();
    }

    private function canView(TaskList $list, User $user): bool
    {
        if ($this->isOwner($list, $user)) {
            return true;
        }
        return $this->memberRepository->findMembership($list, $user) !== null;
    }

    private function canEdit(TaskList $list, User $user): bool
    {
        if ($this->isOwner($list, $user)) {
            return true;
        }
        $member = $this->memberRepository->findMembership($list, $user);
        return $member?->isEditor() ?? false;
    }
}
