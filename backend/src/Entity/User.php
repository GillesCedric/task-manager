<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @class User
 * @description Entité utilisateur avec support avatar (base64 stocké en BDD pour simplifier le déploiement).
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'UNIQ_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['user:read', 'task:read', 'member:read', 'list:read', 'notification:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 180, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    #[Groups(['user:read', 'task:read', 'member:read'])]
    private string $email;

    #[ORM\Column(type: Types::STRING, length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    #[Groups(['user:read', 'task:read', 'member:read', 'list:read', 'notification:read'])]
    private string $name;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['user:read'])]
    private array $roles = [];

    #[ORM\Column(type: Types::STRING)]
    private string $password;

    private ?string $plainPassword = null;

    /**
     * @property {string|null} $avatarUrl — URL ou data URI de l'avatar.
     * On stocke l'URL (Gravatar, upload CDN, ou data URI base64 pour les petites images).
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['user:read', 'task:read', 'member:read', 'notification:read'])]
    private ?string $avatarUrl = null;

    /**
     * @property {string|null} $bio — Courte biographie affichée sur le profil.
     */
    #[ORM\Column(type: Types::STRING, length: 300, nullable: true)]
    #[Assert\Length(max: 300)]
    #[Groups(['user:read'])]
    private ?string $bio = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['user:read'])]
    private \DateTimeImmutable $createdAt;

    /** @var Collection<int, Task> */
    #[ORM\OneToMany(targetEntity: Task::class, mappedBy: 'owner')]
    private Collection $tasks;

    public function __construct()
    {
        $this->tasks = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int                        { return $this->id; }
    public function getEmail(): string                   { return $this->email; }
    public function setEmail(string $e): static          { $this->email = $e; return $this; }
    public function getName(): string                    { return $this->name; }
    public function setName(string $n): static           { $this->name = $n; return $this; }
    public function getUserIdentifier(): string          { return $this->email; }
    public function getRoles(): array                    { $r = $this->roles; $r[] = 'ROLE_USER'; return array_unique($r); }
    public function setRoles(array $r): static           { $this->roles = $r; return $this; }
    public function getPassword(): string                { return $this->password; }
    public function setPassword(string $p): static       { $this->password = $p; return $this; }
    public function getPlainPassword(): ?string          { return $this->plainPassword; }
    public function setPlainPassword(?string $p): static { $this->plainPassword = $p; return $this; }
    public function eraseCredentials(): void             { $this->plainPassword = null; }
    public function getAvatarUrl(): ?string              { return $this->avatarUrl; }
    public function setAvatarUrl(?string $u): static     { $this->avatarUrl = $u; return $this; }
    public function getBio(): ?string                    { return $this->bio; }
    public function setBio(?string $b): static           { $this->bio = $b; return $this; }
    public function getCreatedAt(): \DateTimeImmutable   { return $this->createdAt; }
    public function getTasks(): Collection               { return $this->tasks; }

    /**
     * @method getInitials
     * @description Retourne les initiales du nom pour l'avatar de fallback.
     * @returns {string}
     */
    public function getInitials(): string
    {
        $parts = explode(' ', trim($this->name));
        return strtoupper(
            implode('', array_map(fn($p) => mb_substr($p, 0, 1), array_slice($parts, 0, 2)))
        );
    }
}