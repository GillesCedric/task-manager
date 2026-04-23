<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\ActionLogRepository;
use App\Repository\NotificationRepository;
use App\Repository\TaskListRepository;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Service\AppLogger;
use App\Service\SanitizationService;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * @class AdminController
 * @description Endpoints réservés aux administrateurs — gestion utilisateurs, stats, logs.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.2.0
 */
#[Route('/api/admin', name: 'api_admin_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminController extends AbstractController
{
    public function __construct(
        private readonly UserRepository               $userRepository,
        private readonly TaskRepository              $taskRepository,
        private readonly TaskListRepository          $listRepository,
        private readonly NotificationRepository      $notifRepository,
        private readonly ActionLogRepository         $logRepository,
        private readonly AppLogger                   $logger,
        private readonly SanitizationService         $sanitization,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly Connection                  $connection,
    ) {}

    // ─── Statistiques ────────────────────────────────────────────────────────

    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $taskStats = $this->taskRepository->getGlobalStats();
        $userStats = $this->userRepository->getStats();
        $listStats = $this->listRepository->getStats();
        $logStats  = $this->logRepository->countByLevel();

        return $this->json([
            'success' => true,
            'data'    => [
                'users'  => $userStats,
                'tasks'  => $taskStats,
                'lists'  => $listStats,
                'logs'   => $logStats,
            ],
        ]);
    }

    // ─── Utilisateurs ────────────────────────────────────────────────────────

    #[Route('/users', name: 'users_list', methods: ['GET'])]
    public function users(Request $request): JsonResponse
    {
        $page    = max(1, (int) $request->query->get('page', 1));
        $perPage = min(100, max(1, (int) $request->query->get('per_page', 20)));
        $search  = $request->query->get('search');

        ['items' => $items, 'total' => $total] = $this->userRepository->findPaginated($page, $perPage, $search);

        return $this->json([
            'success'    => true,
            'data'       => $items,
            'pagination' => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ], 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/users/{id}', name: 'users_update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function updateUser(int $id, Request $request, #[CurrentUser] User $admin): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['success' => false, 'error' => 'Utilisateur introuvable.'], 404);
        }
        if ($user->getId() === $admin->getId()) {
            return $this->json(['success' => false, 'error' => 'Impossible de modifier son propre compte via l\'admin.'], 400);
        }

        $data = $this->sanitization->sanitizeArray(json_decode($request->getContent(), true) ?? []);

        if (isset($data['name']) && strlen(trim($data['name'])) >= 2) {
            $user->setName(trim($data['name']));
        }
        if (isset($data['email'])) {
            $email = strtolower(trim($data['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['success' => false, 'error' => 'Adresse email invalide.'], 400);
            }
            $existing = $this->userRepository->findByEmail($email);
            if ($existing !== null && $existing->getId() !== $user->getId()) {
                return $this->json(['success' => false, 'error' => 'Cette adresse email est déjà utilisée.'], 409);
            }
            $user->setEmail($email);
        }
        if (isset($data['roles']) && is_array($data['roles'])) {
            $allowed = ['ROLE_ADMIN', 'ROLE_USER'];
            $roles   = array_values(array_intersect($data['roles'], $allowed));
            $user->setRoles($roles);
        }
        if (isset($data['password']) && strlen($data['password']) >= 8) {
            $user->setPassword($this->hasher->hashPassword($user, $data['password']));
        }

        $this->userRepository->save($user);

        $this->logger->action('admin.user_update',
            userId: $admin->getId(), userName: $admin->getName(),
            resourceType: 'user', resourceId: $user->getId(),
            metadata: ['target' => $user->getEmail(), 'roles' => $user->getRoles()],
        );

        return $this->json(['success' => true, 'data' => $user], 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/users/{id}', name: 'users_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteUser(int $id, #[CurrentUser] User $admin): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['success' => false, 'error' => 'Utilisateur introuvable.'], 404);
        }
        if ($user->getId() === $admin->getId()) {
            return $this->json(['success' => false, 'error' => 'Impossible de supprimer son propre compte.'], 400);
        }

        $targetEmail = $user->getEmail();
        $targetId    = $user->getId();
        $this->userRepository->delete($user);

        $this->logger->action('admin.user_delete',
            userId: $admin->getId(), userName: $admin->getName(),
            resourceType: 'user', resourceId: $targetId,
            metadata: ['target_email' => $targetEmail],
        );

        return $this->json(['success' => true]);
    }

    // ─── Logs ────────────────────────────────────────────────────────────────

    #[Route('/logs', name: 'logs', methods: ['GET'])]
    public function logs(Request $request): JsonResponse
    {
        $page    = max(1, (int) $request->query->get('page', 1));
        $perPage = min(200, max(1, (int) $request->query->get('per_page', 50)));
        $level   = $request->query->get('level')  ?: null;
        $action  = $request->query->get('action') ?: null;
        $userId  = $request->query->get('user_id') ? (int) $request->query->get('user_id') : null;
        $search  = $request->query->get('search')  ?: null;

        ['items' => $items, 'total' => $total] = $this->logRepository->findPaginated($page, $perPage, $level, $action, $userId, $search);

        return $this->json([
            'success'    => true,
            'data'       => $items,
            'pagination' => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => $total > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ], 200, [], ['groups' => ['log:read']]);
    }

    #[Route('/logs', name: 'logs_clear', methods: ['DELETE'])]
    public function clearLogs(Request $request): JsonResponse
    {
        $level = $request->query->get('level') ?: null;

        if ($level) {
            $this->connection->delete('app_logs', ['level' => $level]);
        } else {
            // DELETE préserve l'auto-increment et est transactionnel (vs TRUNCATE)
            $this->connection->executeStatement('DELETE FROM app_logs');
        }

        return $this->json(['success' => true, 'message' => 'Logs supprimés.']);
    }

    // ─── Log client (erreurs JS) ──────────────────────────────────────────────

    #[Route('/logs/client', name: 'logs_client', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function clientLog(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        try {
            $this->connection->insert('app_logs', [
                'level'      => in_array($data['level'] ?? '', ['error', 'warning', 'info'], true) ? $data['level'] : 'info',
                'message'    => mb_substr($data['message'] ?? 'Client error', 0, 2000),
                'context'    => json_encode(array_merge(['user_id' => $user->getId(), 'source' => 'frontend'], $data['context'] ?? [])),
                'channel'    => 'frontend',
                'created_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable) {}

        return $this->json(['success' => true], Response::HTTP_ACCEPTED);
    }
}
