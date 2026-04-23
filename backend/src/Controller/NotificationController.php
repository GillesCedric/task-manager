<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\NotificationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * @class NotificationController
 * @description Endpoints notifications — liste, compteur non-lus, marquer comme lus.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[Route('/api/notifications', name: 'api_notif_')]
final class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationRepository $notifRepository,
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(#[CurrentUser] User $user): JsonResponse
    {
        $notifications = $this->notifRepository->findForUser($user);
        $unread        = $this->notifRepository->countUnread($user);

        return $this->json(
            ['success' => true, 'data' => $notifications, 'unread_count' => $unread],
            Response::HTTP_OK, [], ['groups' => ['notification:read']]
        );
    }

    #[Route('/read-all', name: 'read_all', methods: ['POST'])]
    public function readAll(#[CurrentUser] User $user): JsonResponse
    {
        $this->notifRepository->markAllReadForUser($user);
        return $this->json(['success' => true]);
    }

    #[Route('/{id}/read', name: 'read_one', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function readOne(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $notif = $this->notifRepository->find($id);
        if ($notif === null || $notif->getRecipient()?->getId() !== $user->getId()) {
            return $this->json(['success' => false, 'error' => 'Introuvable.'], 404);
        }
        $notif->markAsRead();
        $this->notifRepository->save($notif);
        return $this->json(['success' => true], 200, [], ['groups' => ['notification:read']]);
    }
}