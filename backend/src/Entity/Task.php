<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TaskPriority;
use App\Enum\TaskStatus;
use App\Repository\TaskRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @class Task
 * @description Entité tâche — appartient désormais à une TaskList et peut être assignée.
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[ORM\Entity(repositoryClass: TaskRepository::class)]
#[ORM\Table(name: 'tasks')]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(fields: ['status'],   name: 'idx_task_status')]
#[ORM\Index(fields: ['priority'], name: 'idx_task_priority')]
#[ORM\Index(fields: ['dueDate'],  name: 'idx_task_due_date')]
class Task
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['task:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 255)]
    #[Groups(['task:read'])]
    private string $title;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 5000)]
    #[Groups(['task:read'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::STRING, length: 20, enumType: TaskStatus::class)]
    #[Groups(['task:read'])]
    private TaskStatus $status = TaskStatus::TODO;

    #[ORM\Column(type: Types::STRING, length: 10, enumType: TaskPriority::class)]
    #[Groups(['task:read'])]
    private TaskPriority $priority = TaskPriority::MEDIUM;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['task:read'])]
    private ?\DateTimeImmutable $dueDate = null;

    /**
     * @property {TaskList} $taskList — La liste à laquelle appartient cette tâche.
     */
    #[ORM\ManyToOne(targetEntity: TaskList::class, inversedBy: 'tasks')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['task:read'])]
    private ?TaskList $taskList = null;

    /**
     * @property {User} $owner — Créateur de la tâche (pour les permissions).
     */
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'tasks')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['task:read'])]
    private ?User $owner = null;

    /**
     * @property {User|null} $assignee — Personne assignée à cette tâche.
     * Peut être n'importe quel membre de la liste (owner ou member).
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['task:read'])]
    private ?User $assignee = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['task:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['task:read'])]
    private \DateTimeImmutable $updatedAt;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function isOverdue(): bool
    {
        return $this->dueDate !== null
            && $this->status !== TaskStatus::DONE
            && $this->dueDate < new \DateTimeImmutable();
    }

    public function getId(): ?int                                      { return $this->id; }
    public function getTitle(): string                                 { return $this->title; }
    public function setTitle(string $t): static                        { $this->title = $t; return $this; }
    public function getDescription(): ?string                          { return $this->description; }
    public function setDescription(?string $d): static                 { $this->description = $d; return $this; }
    public function getStatus(): TaskStatus                            { return $this->status; }
    public function setStatus(TaskStatus $s): static                   { $this->status = $s; return $this; }
    public function getPriority(): TaskPriority                        { return $this->priority; }
    public function setPriority(TaskPriority $p): static               { $this->priority = $p; return $this; }
    public function getDueDate(): ?\DateTimeImmutable                   { return $this->dueDate; }
    public function setDueDate(?\DateTimeImmutable $d): static          { $this->dueDate = $d; return $this; }
    public function getTaskList(): ?TaskList                            { return $this->taskList; }
    public function setTaskList(?TaskList $l): static                  { $this->taskList = $l; return $this; }
    public function getOwner(): ?User                                  { return $this->owner; }
    public function setOwner(?User $u): static                         { $this->owner = $u; return $this; }
    public function getAssignee(): ?User                               { return $this->assignee; }
    public function setAssignee(?User $u): static                      { $this->assignee = $u; return $this; }
    public function getCreatedAt(): \DateTimeImmutable                  { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable                  { return $this->updatedAt; }
}