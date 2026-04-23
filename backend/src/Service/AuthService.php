<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\RegisterDTO;
use App\Entity\User;
use App\Interface\AuthServiceInterface;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * @class AuthService
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
final class AuthService implements AuthServiceInterface
{
    public function __construct(
        private readonly UserRepository              $userRepository,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly JWTTokenManagerInterface    $jwtManager,
        private readonly AppLogger                  $logger,
    ) {}

    /** @return array{user: User, token: string} */
    public function register(RegisterDTO $dto): array
    {
        $email = strtolower(trim($dto->email));

        if ($this->userRepository->findByEmail($email) !== null) {
            $this->logger->security('auth.register_conflict', ['email_domain' => substr($email, strpos($email, '@'))]);
            throw new ConflictHttpException('Cette adresse email est déjà utilisée.');
        }

        $user = (new User())
            ->setEmail($email)
            ->setName(trim($dto->name))
            ->setRoles(['ROLE_USER']);

        $user->setPassword($this->hasher->hashPassword($user, $dto->password));
        $user->eraseCredentials();
        $this->userRepository->save($user);

        $this->logger->action('auth.register',
            userId: $user->getId(),
            userName: $user->getName(),
            resourceType: 'user',
            resourceId: $user->getId(),
        );

        return ['user' => $user, 'token' => $this->jwtManager->create($user)];
    }

    /** @return array{user: User, token: string} */
    public function login(string $email, string $password): array
    {
        $user = $this->userRepository->findByEmail(strtolower(trim($email)));

        if ($user === null || !$this->hasher->isPasswordValid($user, $password)) {
            // Sécurité : log tentative échouée sans confirmer l'existence du compte
            $this->logger->security('auth.login_failed', [
                'email_domain' => ($pos = strrpos($email, '@')) !== false ? substr($email, $pos) : 'unknown',
            ]);
            throw new UnauthorizedHttpException('Bearer', 'Identifiants incorrects.');
        }

        $this->logger->action('auth.login',
            userId: $user->getId(),
            userName: $user->getName(),
            resourceType: 'user',
            resourceId: $user->getId(),
        );

        return ['user' => $user, 'token' => $this->jwtManager->create($user)];
    }
}
