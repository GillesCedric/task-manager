<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Interface\AuthServiceInterface;
use App\Request\TaskRequestTransformer;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * @class AuthController
 * @description Endpoints d'authentification — inscription, connexion, profil.
 *
 * Le token JWT retourné doit être envoyé dans le header
 * Authorization: Bearer <token> pour toutes les requêtes protégées.
 * Durée de vie du token : 1 heure (configurable dans lexik_jwt_authentication.yaml).
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
#[Route('/api/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    /**
     * @method __construct
     * @param {AuthService}            $authService
     * @param {TaskRequestTransformer} $transformer
     */
    public function __construct(
        private readonly AuthServiceInterface   $authService,
        private readonly TaskRequestTransformer $transformer,
    ) {}

    /**
     * @method register
     * @description Inscrit un nouvel utilisateur et retourne un token JWT.
     * L'utilisateur est directement connecté après inscription.
     *
     * @param {Request} $request Doit contenir name, email, password en JSON
     * @returns {JsonResponse}
     */
    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $dto    = $this->transformer->toRegisterDTO($request);
        $result = $this->authService->register($dto);

        return $this->json(
            ['success' => true, 'token' => $result['token'], 'user' => $result['user']],
            Response::HTTP_CREATED,
            [],
            ['groups' => ['user:read']]
        );
    }

    /**
     * @method login
     * @description Connecte un utilisateur et retourne un token JWT.
     *
     * @param {Request} $request Doit contenir email et password en JSON
     * @returns {JsonResponse}
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data   = json_decode($request->getContent(), true) ?? [];
        $result = $this->authService->login(
            $data['email']    ?? '',
            $data['password'] ?? '',
        );

        return $this->json(
            ['success' => true, 'token' => $result['token'], 'user' => $result['user']],
            Response::HTTP_OK,
            [],
            ['groups' => ['user:read']]
        );
    }

    /**
     * @method me
     * @description Retourne le profil de l'utilisateur authentifié.
     *
     * @param {User} $user Injecté depuis le token JWT
     * @returns {JsonResponse}
     */
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(
            ['success' => true, 'user' => $user],
            Response::HTTP_OK,
            [],
            ['groups' => ['user:read']]
        );
    }
}
