<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Interface\TaskServiceInterface;
use App\Request\TaskRequestTransformer;
use App\Security\Voter\TaskVoter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * @class TaskController
 * @description Endpoints REST pour les tâches.
 * Dépend de TaskServiceInterface (DIP) et délègue l'autorisation aux Voters RBAC.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[Route('/api/tasks', name: 'api_tasks_')]
final class TaskController extends AbstractController
{
    public function __construct(
        private readonly TaskServiceInterface    $taskService,
        private readonly TaskRequestTransformer $transformer,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $listIdRaw = $request->query->get('list_id');
        $result    = $this->taskService->getTasks(
            user:     $user,
            page:     max(1, (int) $request->query->get('page', 1)),
            perPage:  min(100, max(1, (int) $request->query->get('per_page', 10))),
            status:   $request->query->get('status'),
            priority: $request->query->get('priority'),
            search:   $request->query->get('search'),
            sort:     $request->query->get('sort', 'createdAt'),
            order:    strtoupper($request->query->get('order', 'DESC')),
            listId:   $listIdRaw !== null ? (int) $listIdRaw : null,
        );

        $data = $result->toArray();
        return $this->json(
            ['success' => true, 'data' => $data['items'], 'pagination' => $data['pagination']],
            Response::HTTP_OK, [], ['groups' => ['task:read']]
        );
    }

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $task = $this->taskService->getTaskById($id, $user);
        $this->denyAccessUnlessGranted(TaskVoter::VIEW, $task);

        return $this->json(
            ['success' => true, 'data' => $task],
            Response::HTTP_OK, [], ['groups' => ['task:read']]
        );
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $task = $this->taskService->createTask($this->transformer->toCreateDTO($request), $user);
        return $this->json(
            ['success' => true, 'data' => $task],
            Response::HTTP_CREATED, [], ['groups' => ['task:read']]
        );
    }

    #[Route('/{id}', name: 'update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $task = $this->taskService->getTaskById($id, $user);
        $this->denyAccessUnlessGranted(TaskVoter::EDIT, $task);

        $updated = $this->taskService->updateTask($id, $this->transformer->toUpdateDTO($request), $user);
        return $this->json(
            ['success' => true, 'data' => $updated],
            Response::HTTP_OK, [], ['groups' => ['task:read']]
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $task = $this->taskService->getTaskById($id, $user);
        $this->denyAccessUnlessGranted(TaskVoter::DELETE, $task);

        $this->taskService->deleteTask($id, $user);
        return $this->json(['success' => true]);
    }
}
