<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TaskListRole;
use App\Repository\TaskListMemberRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * @class TaskListMember
 * @description Relation entre un utilisateur et une liste de tâches avec son rôle.
 *
 * Deux rôles possibles :
 *   - editor : peut créer, modifier, supprimer des tâches
 *   - reader : lecture seule
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[ORM\Entity(repositoryClass: TaskListMemberRepository::class)]
#[ORM\Table(name: 'task_list_members')]
#[ORM\UniqueConstraint(name: 'UNIQ_MEMBER', fields: ['taskList', 'user'])]
#[ORM\HasLifecycleCallbacks]
class TaskListMember
{

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['member:read', 'list:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TaskList::class, inversedBy: 'members')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?TaskList $taskList = null;

    #[ORM\ManyToOne(targetEntity: User::class, fetch: 'EAGER')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['member:read', 'list:detail'])]
    private ?User $user = null;

    #[ORM\Column(type: Types::STRING, length: 10)]
    #[Groups(['member:read'])]
    private string $role = TaskListRole::READER->value;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['member:read'])]
    private \DateTimeImmutable $joinedAt;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->joinedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int              { return $this->id; }
    public function getTaskList(): ?TaskList   { return $this->taskList; }
    public function setTaskList(?TaskList $l): static { $this->taskList = $l; return $this; }
    public function getUser(): ?User           { return $this->user; }
    public function setUser(?User $u): static  { $this->user = $u; return $this; }
    public function getRole(): string          { return $this->role; }
    public function setRole(string $r): static { $this->role = $r; return $this; }
    public function getJoinedAt(): \DateTimeImmutable { return $this->joinedAt; }

    public function isEditor(): bool { return $this->role === TaskListRole::EDITOR->value; }
    public function isReader(): bool { return $this->role === TaskListRole::READER->value; }
}