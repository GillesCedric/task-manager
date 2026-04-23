<?php

declare(strict_types=1);

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * @class HealthController
 * @description Endpoint de health check pour Railway, load balancers et monitoring.
 *
 * GET /api/health — retourne 200 si l'application est opérationnelle.
 * Vérifie la connectivité DB (connexion réelle, pas juste le process PHP).
 *
 * Route publique (pas d'auth JWT) — configurée dans security.yaml.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 */
#[Route('/api/health', name: 'api_health', methods: ['GET'])]
final class HealthController extends AbstractController
{
    public function __construct(private readonly Connection $connection) {}

    public function __invoke(): JsonResponse
    {
        $dbOk = false;

        try {
            $this->connection->executeQuery('SELECT 1');
            $dbOk = true;
        } catch (\Throwable) {
            // DB indisponible — on retourne 503 mais sans crash
        }

        $status = $dbOk ? 'ok' : 'degraded';
        $code   = $dbOk ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE;

        return $this->json([
            'status'  => $status,
            'db'      => $dbOk ? 'ok' : 'error',
            'version' => '1.2.0',
        ], $code);
    }
}
