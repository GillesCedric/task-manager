<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;
use App\Enum\TaskStatus;
use App\Enum\TaskPriority;

/**
 * @class UpdateTaskDTO
 * @description DTO de mise à jour partielle d'une tâche (sémantique PATCH).
 *
 * Tous les champs sont nullable — null signifie "ne pas modifier ce champ",
 * pas "effacer la valeur". Cette distinction est critique pour un PATCH correct.
 *
 * @package App\DTO
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class UpdateTaskDTO
{
    #[Assert\Length(min: 3, max: 255)]
    public readonly ?string $title;

    #[Assert\Length(max: 5000)]
    public readonly ?string $description;

    #[Assert\Choice(choices: [TaskStatus::TODO->value, TaskStatus::IN_PROGRESS->value, TaskStatus::DONE->value], message: 'Statut invalide.')]
    public readonly ?string $status;

    #[Assert\Choice(choices: [TaskPriority::LOW->value, TaskPriority::MEDIUM->value, TaskPriority::HIGH->value, TaskPriority::URGENT->value], message: 'Priorité invalide.')]
    public readonly ?string $priority;

    public readonly ?\DateTimeImmutable $dueDate;

    /** Null = désassigner, absent = ne pas toucher */
    public readonly ?int $assigneeId;

    /** Indique si assigneeId a été explicitement fourni dans la requête */
    public readonly bool $assigneeProvided;
    
    public function __construct(
        ?string            $title       = null,
        ?string            $description = null,
        ?string            $status      = null,
        ?string            $priority    = null,
        ?\DateTimeImmutable $dueDate    = null,
        ?int               $assigneeId   = null,
        bool               $assigneeProvided = false,
    ) {
        $this->title       = $title;
        $this->description = $description;
        $this->status      = $status;
        $this->priority    = $priority;
        $this->dueDate     = $dueDate;
        $this->assigneeId  = $assigneeId;
        $this->assigneeProvided = $assigneeProvided;
    }
}
