<?php

declare(strict_types=1);

namespace App\Interface;

use App\DTO\RegisterDTO;
use App\Entity\User;

/**
 * @interface AuthServiceInterface
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
interface AuthServiceInterface
{
    /** @return array{user: User, token: string} */
    public function register(RegisterDTO $dto): array;

    /** @return array{user: User, token: string} */
    public function login(string $email, string $password): array;
}
