<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\SanitizationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * @class ProfileController
 * @description Gestion du profil utilisateur — infos, avatar, mot de passe.
 *
 * @package App\Controller
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 */
#[Route('/api/profile', name: 'api_profile_')]
final class ProfileController extends AbstractController
{
    public function __construct(
        private readonly UserRepository              $userRepository,
        private readonly SanitizationService        $sanitization,
        private readonly UserPasswordHasherInterface $hasher,
    ) {}

    #[Route('', name: 'update', methods: ['PATCH'])]
    public function update(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $data = $this->sanitization->sanitizeArray($data);

        if (isset($data['name']) && strlen(trim($data['name'])) >= 2) {
            $user->setName(trim($data['name']));
        }
        if (array_key_exists('bio', $data)) {
            $user->setBio($data['bio'] ? substr($data['bio'], 0, 300) : null);
        }

        $this->userRepository->save($user);
        return $this->json(['success' => true, 'user' => $user], 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/avatar', name: 'avatar', methods: ['POST'])]
    public function updateAvatar(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        // On accepte une data URI base64 (image/jpeg ou image/png, max 1 MB)
        $avatarData = $data['avatar'] ?? null;

        if ($avatarData === null) {
            $user->setAvatarUrl(null);
        } else {
            // Valider le format data URI : data:image/TYPE;base64,DATA
            if (!preg_match('/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+\/=]+)$/', $avatarData, $matches)) {
                throw new BadRequestHttpException('Format d\'avatar invalide. Attendu : data URI base64 (jpeg, png, webp).');
            }
            // Vérification taille approximative (base64 ~ 4/3 de la taille réelle)
            if (strlen($avatarData) > 1_400_000) {
                throw new BadRequestHttpException('Avatar trop volumineux (max 1 MB).');
            }
            // Vérifier que c'est du vrai base64 valide
            if (base64_decode($matches[2], true) === false) {
                throw new BadRequestHttpException('Données base64 corrompues.');
            }
            $user->setAvatarUrl($avatarData);
        }

        $this->userRepository->save($user);
        return $this->json(['success' => true, 'user' => $user], 200, [], ['groups' => ['user:read']]);
    }

    #[Route('/password', name: 'password', methods: ['POST'])]
    public function changePassword(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $current = $data['current_password'] ?? '';
        $new     = $data['new_password']     ?? '';

        if (!$this->hasher->isPasswordValid($user, $current)) {
            throw new BadRequestHttpException('Mot de passe actuel incorrect.');
        }

        if (strlen($new) < 8 || !preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $new)) {
            throw new BadRequestHttpException('Le nouveau mot de passe ne respecte pas les critères de sécurité.');
        }

        $user->setPassword($this->hasher->hashPassword($user, $new));
        $this->userRepository->save($user);

        return $this->json(['success' => true, 'message' => 'Mot de passe mis à jour.']);
    }
}