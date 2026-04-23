<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * @class Notification
 * @description Notification utilisateur — invitation, action partagée, assignment.
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\Table(name: 'notifications')]
#[ORM\Index(fields: ['recipient', 'isRead'], name: 'idx_notif_recipient_read')]
#[ORM\HasLifecycleCallbacks]
class Notification
{

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['notification:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $recipient = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['notification:read'])]
    private ?User $actor = null;

    #[ORM\Column(type: Types::STRING, length: 30)]
    #[Groups(['notification:read'])]
    private string $type;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['notification:read'])]
    private array $payload = [];

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['notification:read'])]
    private bool $isRead = false;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['notification:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int              { return $this->id; }
    public function getRecipient(): ?User      { return $this->recipient; }
    public function setRecipient(?User $u): static { $this->recipient = $u; return $this; }
    public function getActor(): ?User          { return $this->actor; }
    public function setActor(?User $u): static { $this->actor = $u; return $this; }
    public function getType(): string          { return $this->type; }
    public function setType(string $t): static { $this->type = $t; return $this; }
    public function getPayload(): array        { return $this->payload; }
    public function setPayload(array $p): static { $this->payload = $p; return $this; }
    public function isRead(): bool             { return $this->isRead; }
    public function markAsRead(): static       { $this->isRead = true; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}