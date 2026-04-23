<?php

declare(strict_types=1);

namespace App\DTO;

use App\Enum\TaskPriority;
use App\Enum\TaskStatus;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @class CreateTaskDTO
 * @description DTO de création d'une tâche — frontière entre la requête HTTP et le domaine.
 *
 * Toutes les propriétés sont readonly : une fois le DTO construit et validé,
 * rien ne peut le modifier. Ce qui arrive au Service est exactement ce qui a
 * été validé — pas d'altération possible en chemin.
 *
 * @package App\DTO
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class CreateTaskDTO
{
    /**
     * @property {string} $title — Titre obligatoire, entre 3 et 255 caractères.
     */
    #[Assert\NotBlank(message: 'Le titre est obligatoire.')]
    #[Assert\Length(
        min: 3,
        max: 255,
        minMessage: 'Le titre doit faire au moins {{ limit }} caractères.',
        maxMessage: 'Le titre ne peut pas dépasser {{ limit }} caractères.'
    )]
    public readonly string $title;

    /**
     * @property {string|null} $description — Description optionnelle, max 5000 caractères.
     */
    #[Assert\Length(max: 5000, maxMessage: 'La description ne peut pas dépasser {{ limit }} caractères.')]
    public readonly ?string $description;

    /**
     * @property {string} $status — Doit être une valeur valide de l'enum TaskStatus.
     */
    #[Assert\NotNull(message: 'Le statut est obligatoire.')]
    #[Assert\Choice(choices: [TaskStatus::TODO->value, TaskStatus::IN_PROGRESS->value, TaskStatus::DONE->value], message: 'Statut invalide.')]
    public readonly string $status;

    /**
     * @property {string} $priority — Niveau de priorité, valeur de l'enum TaskPriority.
     */
    #[Assert\NotNull(message: 'La priorité est obligatoire.')]
    #[Assert\Choice(choices: [TaskPriority::LOW->value, TaskPriority::MEDIUM->value, TaskPriority::HIGH->value, TaskPriority::URGENT->value], message: 'Priorité invalide.')]
    public readonly string $priority;

    /**
     * @property {\DateTimeImmutable|null} $dueDate — Date d'échéance optionnelle.
     */
    public readonly ?\DateTimeImmutable $dueDate;

    #[Assert\NotNull(message: 'L\'identifiant de la liste est obligatoire.')]
    #[Assert\Positive]
    public readonly int $listId;
    
    #[Assert\Positive]
    public readonly ?int $assigneeId;
    
    public function __construct(
        string             $title,
        int                $listId,
        ?string            $description = null,
        string             $status      = TaskStatus::TODO->value,
        string             $priority    = TaskPriority::MEDIUM->value,
        ?\DateTimeImmutable $dueDate    = null,
        ?int               $assigneeId   = null,
    ) {
        $this->title       = $title;
        $this->listId      = $listId;
        $this->description = $description;
        $this->status      = $status;
        $this->priority    = $priority;
        $this->dueDate     = $dueDate;
        $this->assigneeId  = $assigneeId;
    }
}
