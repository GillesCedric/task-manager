<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Enum\TaskListRole;
use App\Interface\TaskListServiceInterface;
use App\Security\Voter\TaskListVoter;
use App\Service\SanitizationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * @class TaskListController
 * @description CRUD listes + gestion membres + liens d'invitation.
 * Dépend de TaskListServiceInterface (DIP) et délègue l'autorisation aux Voters RBAC.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[Route('/api/lists', name: 'api_lists_')]
final class TaskListController extends AbstractController
{
    public function __construct(
        private readonly TaskListServiceInterface $listService,
        private readonly SanitizationService     $sanitization,
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(
            ['success' => true, 'data' => $this->listService->getAccessibleLists($user)],
            Response::HTTP_OK, [], ['groups' => ['list:read']]
        );
    }

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::VIEW, $list);

        return $this->json(
            ['success' => true, 'data' => $list],
            Response::HTTP_OK, [], ['groups' => ['list:detail', 'member:read']]
        );
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = $this->sanitization->sanitizeArray(
            json_decode($request->getContent(), true) ?? []
        );

        if (empty(trim($data['name'] ?? ''))) {
            return $this->json(['success' => false, 'error' => 'Le nom de la liste est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $list = $this->listService->createList(
            name:        trim($data['name']),
            color:       $data['color']       ?? '#3b82f6',
            description: $data['description'] ?? null,
            owner:       $user
        );

        return $this->json(
            ['success' => true, 'data' => $list],
            Response::HTTP_CREATED, [], ['groups' => ['list:detail', 'member:read']]
        );
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::MANAGE, $list);

        $data = $this->sanitization->sanitizeArray(
            json_decode($request->getContent(), true) ?? []
        );

        $updated = $this->listService->updateList(
            id:          $id,
            name:        $data['name']  ?? $list->getName(),
            color:       $data['color'] ?? $list->getColor(),
            description: array_key_exists('description', $data) ? $data['description'] : $list->getDescription(),
            user:        $user
        );

        return $this->json(
            ['success' => true, 'data' => $updated],
            Response::HTTP_OK, [], ['groups' => ['list:detail', 'member:read']]
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::MANAGE, $list);

        $this->listService->deleteList($id, $user);
        return $this->json(['success' => true]);
    }

    // ─── Invitations ─────────────────────────────────────────────────────────

    #[Route('/{id}/invite', name: 'invite_generate', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function generateInvite(int $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::MANAGE, $list);

        $data = json_decode($request->getContent(), true) ?? [];
        $role = in_array($data['role'] ?? '', TaskListRole::values(), true)
            ? $data['role']
            : TaskListRole::READER->value;

        $token = $this->listService->generateInviteLink($id, $role, $user);

        return $this->json(['success' => true, 'token' => $token, 'invite_url' => "/join/{$token}"]);
    }

    #[Route('/{id}/invite', name: 'invite_revoke', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function revokeInvite(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::MANAGE, $list);

        $this->listService->revokeInviteLink($id, $user);
        return $this->json(['success' => true]);
    }

    #[Route('/join/{token}', name: 'join', methods: ['POST'])]
    public function join(string $token, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->joinByToken($token, $user);
        return $this->json(
            ['success' => true, 'data' => $list],
            Response::HTTP_OK, [], ['groups' => ['list:detail', 'member:read']]
        );
    }

    #[Route('/{id}/leave', name: 'leave', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function leave(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::VIEW, $list);

        $this->listService->leaveList($id, $user);
        return $this->json(['success' => true]);
    }

    // ─── Membres ─────────────────────────────────────────────────────────────

    #[Route('/{id}/members/{memberId}/role', name: 'member_role', methods: ['PATCH'],
        requirements: ['id' => '\d+', 'memberId' => '\d+'])]
    public function updateMemberRole(int $id, int $memberId, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::MANAGE, $list);

        $data   = json_decode($request->getContent(), true) ?? [];
        $role   = in_array($data['role'] ?? '', TaskListRole::values(), true) ? $data['role'] : TaskListRole::READER->value;
        $member = $this->listService->updateMemberRole($id, $memberId, $role, $user);

        return $this->json(
            ['success' => true, 'data' => $member],
            Response::HTTP_OK, [], ['groups' => ['member:read']]
        );
    }

    #[Route('/{id}/members/{memberId}', name: 'member_remove', methods: ['DELETE'],
        requirements: ['id' => '\d+', 'memberId' => '\d+'])]
    public function removeMember(int $id, int $memberId, #[CurrentUser] User $user): JsonResponse
    {
        $list = $this->listService->getList($id, $user);
        $this->denyAccessUnlessGranted(TaskListVoter::MANAGE, $list);

        $this->listService->removeMember($id, $memberId, $user);
        return $this->json(['success' => true]);
    }
}
