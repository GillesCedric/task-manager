<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Interface\TaskServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * @class StatisticsController
 * @description Endpoint de statistiques agrégées pour le dashboard.
 *
 * Données calculées en une seule requête SQL — pas de N+1.
 * Résultats mis en cache 2 minutes via TaskCacheService.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
#[Route('/api/statistics', name: 'api_statistics_')]
final class StatisticsController extends AbstractController
{
    /**
     * @method __construct
     * @param {TaskServiceInterface} $taskService
     */
    public function __construct(
        private readonly TaskServiceInterface $taskService,
    ) {}

    /**
     * @method index
     * @description Retourne les statistiques agrégées de l'utilisateur courant.
     *
     * @param {User} $user Injecté depuis le token JWT
     * @returns {JsonResponse}
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(
            ['success' => true, 'data' => $this->taskService->getStatistics($user)],
            Response::HTTP_OK
        );
    }
}
