<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ActionLog;
use App\Repository\ActionLogRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @class AppLogger
 * @description Logger entreprise — deux canaux distincts.
 *
 * Canal Monolog "audit"    → JSON → fichier/stdout → Loki (ingestion par promtail/alloy)
 * Canal Monolog "security" → JSON → fichier → Grafana alerting
 * Canal DB "action_logs"   → admin UI / audit trail requêtable
 *
 * Convention de nommage des actions : <domaine>.<verbe>
 *   auth.login | auth.logout | auth.register | auth.login_failed
 *   task.create | task.update | task.delete
 *   tasklist.create | tasklist.delete | tasklist.share | tasklist.join
 *   admin.user_promote | admin.user_delete | admin.logs_clear
 *   security.rate_limit | security.unauthorized | security.invalid_token
 *
 * @package App\Service
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 */
final class AppLogger
{
    public function __construct(
        #[Autowire(service: 'monolog.logger.audit')]    private readonly LoggerInterface $auditLogger,
        #[Autowire(service: 'monolog.logger.security')] private readonly LoggerInterface $securityLogger,
        private readonly LoggerInterface                                                  $logger,
        private readonly ActionLogRepository                                              $actionLogRepository,
        private readonly RequestStack                                                     $requestStack,
    ) {}

    // ─── Canal système Monolog (→ fichier → Loki) ─────────────────────────────

    /** Erreur système ou exception inattendue. Ne jamais y mettre de données utilisateur. */
    public function error(string $message, array $context = []): void
    {
        $this->logger->error($message, $this->buildSystemContext($context));
    }

    /** Avertissement technique — dégradation sans coupure. */
    public function warning(string $message, array $context = []): void
    {
        $this->logger->warning($message, $this->buildSystemContext($context));
    }

    /**
     * Événement sécurité — canal dédié pour alerting Grafana.
     * Toujours persisté en DB audit avec level=security.
     */
    public function security(string $action, array $context = [], ?int $userId = null, ?string $userName = null): void
    {
        $ctx = $this->buildStructuredContext($action, $userId, $userName, null, null, $context);
        $this->securityLogger->warning($action, $ctx);

        $this->persistAction($action, ActionLog::LEVEL_SECURITY, $userId, $userName, $context);
    }

    // ─── Canal Audit (→ DB + JSON → Loki) ────────────────────────────────────

    /**
     * Action utilisateur significative.
     * N'appeler QUE pour des mutations métier, jamais pour des lectures.
     *
     * @param string      $action       Convention: <domaine>.<verbe>
     * @param int|null    $userId       Auteur (null = action système)
     * @param string|null $userName     Dénormalisé pour requêtes rapides
     * @param string|null $resourceType "task" | "tasklist" | "user"
     * @param int|null    $resourceId
     * @param array       $metadata     Données contextuelles (diff, payload partiel)
     * @param int|null    $durationMs   Temps d'exécution en ms
     */
    public function action(
        string  $action,
        ?int    $userId       = null,
        ?string $userName     = null,
        ?string $resourceType = null,
        ?int    $resourceId   = null,
        array   $metadata     = [],
        ?int    $durationMs   = null,
    ): void {
        $ctx = $this->buildStructuredContext($action, $userId, $userName, $resourceType, $resourceId, $metadata, $durationMs);
        $this->auditLogger->info($action, $ctx);

        $this->persistAction($action, ActionLog::LEVEL_ACTION, $userId, $userName, $metadata, $resourceType, $resourceId, $durationMs);
    }

    // ─── Privé ────────────────────────────────────────────────────────────────

    private function buildStructuredContext(
        string  $action,
        ?int    $userId,
        ?string $userName,
        ?string $resourceType,
        ?int    $resourceId,
        array   $extra       = [],
        ?int    $durationMs  = null,
    ): array {
        return array_filter([
            'action'        => $action,
            'user_id'       => $userId,
            'user_name'     => $userName,
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
            'ip'            => $this->getClientIp(),
            'duration_ms'   => $durationMs,
            'metadata'      => $extra ?: null,
        ], fn($v) => $v !== null);
    }

    private function buildSystemContext(array $extra = []): array
    {
        return array_filter(array_merge(['ip' => $this->getClientIp()], $extra));
    }

    private function persistAction(
        string  $action,
        string  $level,
        ?int    $userId       = null,
        ?string $userName     = null,
        array   $metadata     = [],
        ?string $resourceType = null,
        ?int    $resourceId   = null,
        ?int    $durationMs   = null,
    ): void {
        try {
            $log = (new ActionLog())
                ->setAction($action)
                ->setLevel($level)
                ->setUserId($userId)
                ->setUserName($userName)
                ->setResourceType($resourceType)
                ->setResourceId($resourceId)
                ->setIpAddress($this->getClientIp())
                ->setDurationMs($durationMs)
                ->setMetadata($metadata);

            $this->actionLogRepository->save($log);
        } catch (\Throwable) {
            // Le logging ne doit JAMAIS casser l'application
        }
    }

    private function getClientIp(): ?string
    {
        return $this->requestStack->getCurrentRequest()?->getClientIp();
    }
}
