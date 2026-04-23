<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ActionLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * @class ActionLog
 * @description Audit trail des actions utilisateur — stocké en base pour l'admin UI.
 *
 * Seules les actions métier significatives sont enregistrées ici.
 * Les logs système (erreurs, warnings) vont dans Monolog → fichier → Loki.
 *
 * Format Loki-ready : champs indexables comme labels (action, level, resource_type).
 *
 * @package App\Entity
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 */
#[ORM\Entity(repositoryClass: ActionLogRepository::class)]
#[ORM\Table(name: 'action_logs')]
#[ORM\Index(fields: ['action'],       name: 'idx_alog_action')]
#[ORM\Index(fields: ['level'],        name: 'idx_alog_level')]
#[ORM\Index(fields: ['userId'],       name: 'idx_alog_user')]
#[ORM\Index(fields: ['resourceType'], name: 'idx_alog_resource')]
#[ORM\Index(fields: ['createdAt'],    name: 'idx_alog_date')]
class ActionLog
{
    /**
     * Niveaux de log — maps to Loki labels.
     * 'action'   → action utilisateur normale (info)
     * 'security' → événement lié à la sécurité (warning)
     * 'error'    → erreur fonctionnelle côté utilisateur
     */
    public const LEVEL_ACTION   = 'action';
    public const LEVEL_SECURITY = 'security';
    public const LEVEL_ERROR    = 'error';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['log:read'])]
    private ?int $id = null;

    /** action.login | task.create | tasklist.delete | admin.promote … */
    #[ORM\Column(type: Types::STRING, length: 60)]
    #[Groups(['log:read'])]
    private string $action;

    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Groups(['log:read'])]
    private string $level = self::LEVEL_ACTION;

    /** ID de l'utilisateur ayant déclenché l'action (null = système) */
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['log:read'])]
    private ?int $userId = null;

    /** Nom de l'utilisateur — dénormalisé pour éviter les JOINs sur les logs */
    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $userName = null;

    /** Type de ressource concernée : task | tasklist | user | list_member */
    #[ORM\Column(type: Types::STRING, length: 40, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $resourceType = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['log:read'])]
    private ?int $resourceId = null;

    #[ORM\Column(type: Types::STRING, length: 45, nullable: true)]
    #[Groups(['log:read'])]
    private ?string $ipAddress = null;

    /** Durée de l'opération en millisecondes */
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['log:read'])]
    private ?int $durationMs = null;

    /** Données contextuelles libres : diff avant/après, payload partiel… */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['log:read'])]
    private array $metadata = [];

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['log:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\PrePersist]
    public function onPrePersist(): void { $this->createdAt = new \DateTimeImmutable(); }

    // --- Fluent setters ---

    public function setAction(string $a): static      { $this->action       = $a;  return $this; }
    public function setLevel(string $l): static        { $this->level        = $l;  return $this; }
    public function setUserId(?int $id): static        { $this->userId       = $id; return $this; }
    public function setUserName(?string $n): static    { $this->userName     = $n;  return $this; }
    public function setResourceType(?string $t): static{ $this->resourceType = $t;  return $this; }
    public function setResourceId(?int $id): static    { $this->resourceId   = $id; return $this; }
    public function setIpAddress(?string $ip): static  { $this->ipAddress    = $ip; return $this; }
    public function setDurationMs(?int $ms): static    { $this->durationMs   = $ms; return $this; }
    public function setMetadata(array $m): static      { $this->metadata     = $m;  return $this; }

    public function getId(): ?int                { return $this->id; }
    public function getAction(): string          { return $this->action; }
    public function getLevel(): string           { return $this->level; }
    public function getUserId(): ?int            { return $this->userId; }
    public function getUserName(): ?string       { return $this->userName; }
    public function getResourceType(): ?string   { return $this->resourceType; }
    public function getResourceId(): ?int        { return $this->resourceId; }
    public function getIpAddress(): ?string      { return $this->ipAddress; }
    public function getDurationMs(): ?int        { return $this->durationMs; }
    public function getMetadata(): array         { return $this->metadata; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
