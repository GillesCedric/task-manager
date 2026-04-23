<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TaskListRole;
use App\Repository\TaskListRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @class TaskList
 * @description Liste de tâches — privée ou partagée avec d'autres utilisateurs.
 *
 * Les groupes de sérialisation sont soigneusement hiérarchisés :
 * - list:read  → données de base de la liste
 * - list:detail → données de base + membres (évite les chargements lourds dans les listes)
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[ORM\Entity(repositoryClass: TaskListRepository::class)]
#[ORM\Table(name: 'task_lists')]
#[ORM\HasLifecycleCallbacks]
class TaskList
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column(type: Types::INTEGER)]
	#[Groups(['list:read', 'list:detail', 'task:read'])]
	private ?int $id = null;

	#[ORM\Column(type: Types::STRING, length: 100)]
	#[Assert\NotBlank(message: 'Le nom est obligatoire.')]
	#[Assert\Length(min: 1, max: 100)]
	#[Groups(['list:read', 'list:detail', 'task:read'])]
	private string $name;

	#[ORM\Column(type: Types::TEXT, nullable: true)]
	#[Groups(['list:read', 'list:detail'])]
	private ?string $description = null;

	#[ORM\Column(type: Types::STRING, length: 7)]
	#[Assert\Regex(pattern: '/^#[0-9A-Fa-f]{6}$/')]
	#[Groups(['list:read', 'list:detail', 'task:read'])]
	private string $color = '#3b82f6';

	#[ORM\ManyToOne(targetEntity: User::class)]
	#[ORM\JoinColumn(nullable: false)]
	#[Groups(['list:read', 'list:detail'])]
	private ?User $owner = null;

	/**
	 * @property {string|null} $inviteToken
	 * @description Token unique pour le lien de partage. Exposé UNIQUEMENT au propriétaire.
	 */
	#[ORM\Column(type: Types::STRING, length: 64, nullable: true, unique: true)]
	#[Groups(['list:detail'])]
	private ?string $inviteToken = null;

	#[ORM\Column(type: Types::STRING, length: 10, nullable: true)]
	#[Assert\Choice(choices: [TaskListRole::EDITOR->value, TaskListRole::READER->value])]
	#[Groups(['list:detail'])]
	private ?string $defaultInviteRole = TaskListRole::READER->value;

	/**
	 * @property {Collection<int, TaskListMember>} $members
	 * @description Membres de la liste — chargé uniquement dans list:detail.
	 */
	#[ORM\OneToMany(
		targetEntity: TaskListMember::class,
		mappedBy: 'taskList',
		cascade: ['persist', 'remove'],
		fetch: 'EAGER'
	)]
	#[Groups(['list:detail'])]
	private Collection $members;

	#[ORM\OneToMany(targetEntity: Task::class, mappedBy: 'taskList', cascade: ['remove'])]
	private Collection $tasks;

	#[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
	#[Groups(['list:read', 'list:detail'])]
	private \DateTimeImmutable $createdAt;

	#[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
	#[Groups(['list:read', 'list:detail'])]
	private \DateTimeImmutable $updatedAt;

	public function __construct()
	{
		$this->members = new ArrayCollection();
		$this->tasks   = new ArrayCollection();
	}

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

	/**
	 * @method generateInviteToken
	 * @description Génère un nouveau token d'invitation cryptographiquement sûr.
	 * @returns {string}
	 */
	public function generateInviteToken(): string
	{
		$this->inviteToken = bin2hex(random_bytes(32));
		return $this->inviteToken;
	}

	/**
	 * @method revokeInviteToken
	 * @description Révoque le lien de partage existant.
	 */
	public function revokeInviteToken(): void
	{
		$this->inviteToken = null;
	}

	/**
	 * @method isOwnedBy
	 * @description Vérifie si un utilisateur est propriétaire de cette liste.
	 * @param {User} $user
	 * @returns {bool}
	 */
	public function isOwnedBy(User $user): bool
	{
		return $this->owner?->getId() === $user->getId();
	}

	// --- Getters / Setters ---

	public function getId(): ?int
	{
		return $this->id;
	}
	public function getName(): string
	{
		return $this->name;
	}
	public function setName(string $n): static
	{
		$this->name = $n;
		return $this;
	}
	public function getDescription(): ?string
	{
		return $this->description;
	}
	public function setDescription(?string $d): static
	{
		$this->description = $d;
		return $this;
	}
	public function getColor(): string
	{
		return $this->color;
	}
	public function setColor(string $c): static
	{
		$this->color = $c;
		return $this;
	}
	public function getOwner(): ?User
	{
		return $this->owner;
	}
	public function setOwner(?User $u): static
	{
		$this->owner = $u;
		return $this;
	}
	public function getInviteToken(): ?string
	{
		return $this->inviteToken;
	}
	public function getDefaultInviteRole(): ?string
	{
		return $this->defaultInviteRole;
	}
	public function setDefaultInviteRole(?string $r): static
	{
		$this->defaultInviteRole = $r;
		return $this;
	}
	public function getMembers(): Collection
	{
		return $this->members;
	}
	public function getTasks(): Collection
	{
		return $this->tasks;
	}
	public function getCreatedAt(): \DateTimeImmutable
	{
		return $this->createdAt;
	}
	public function getUpdatedAt(): \DateTimeImmutable
	{
		return $this->updatedAt;
	}

	/**
	 * @method getMemberCount
	 * @description Retourne le nombre de membres (hors propriétaire).
	 * Exposé dans list:read pour l'affichage dans la sidebar sans charger tous les membres.
	 * @returns {int}
	 */
	#[Groups(['list:read'])]
	public function getMemberCount(): int
	{
		return $this->members->count();
	}
}
