<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Task;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * @class TaskVoter
 * @description Politique RBAC pour les tâches.
 *
 * Matrice de droits (dérive de TaskListVoter) :
 *   VIEW   → peut accéder à la liste contenant la tâche
 *   EDIT   → peut éditer dans la liste
 *   DELETE → peut éditer dans la liste
 *
 * @package App\Security\Voter
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 * @extends Voter<string, Task>
 */
final class TaskVoter extends Voter
{
    public const VIEW   = 'TASK_VIEW';
    public const EDIT   = 'TASK_EDIT';
    public const DELETE = 'TASK_DELETE';

    public function __construct(
        private readonly AuthorizationCheckerInterface $authChecker,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof Task;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Task $task */
        $task = $subject;
        $list = $task->getTaskList();

        if ($list === null) {
            return false;
        }

        return match ($attribute) {
            self::VIEW   => $this->authChecker->isGranted(TaskListVoter::VIEW, $list),
            self::EDIT,
            self::DELETE => $this->authChecker->isGranted(TaskListVoter::EDIT, $list),
            default      => false,
        };
    }
}
