<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\AppLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * @class AppLog
 * @description Journal d'application stocké en base de données.
 * Accessible via le panel administrateur.
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 */
#[ORM\Entity(repositoryClass: AppLogRepository::class)]
#[ORM\Table(name: 'app_logs')]
#[ORM\Index(fields: ['level'],     name: 'idx_log_level')]
#[ORM\Index(fields: ['createdAt'], name: 'idx_log_date')]
class AppLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['log:read'])]
    private ?int $id = null;

    /** debug | info | warning | error | security */
    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Groups(['log:read'])]
    private string $level = 'info';

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['log:read'])]
    private string $message = '';

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['log:read'])]
    private array $context = [];

    #[ORM\Column(type: Types::STRING, length: 30, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $channel = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['log:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int                { return $this->id; }
    public function getLevel(): string           { return $this->level; }
    public function setLevel(string $l): static  { $this->level = $l; return $this; }
    public function getMessage(): string         { return $this->message; }
    public function setMessage(string $m): static { $this->message = mb_substr($m, 0, 2000); return $this; }
    public function getContext(): array          { return $this->context; }
    public function setContext(array $c): static { $this->context = $c; return $this; }
    public function getChannel(): ?string        { return $this->channel; }
    public function setChannel(?string $c): static { $this->channel = $c; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
