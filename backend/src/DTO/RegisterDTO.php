<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * @class RegisterDTO
 * @description DTO d'inscription — valide la complexité du mot de passe dès l'entrée.
 *
 * @package App\DTO
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class RegisterDTO
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    public readonly string $name;

    #[Assert\NotBlank]
    #[Assert\Email(message: 'Email invalide.')]
    #[Assert\Length(max: 180)]
    public readonly string $email;

    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 100, minMessage: 'Le mot de passe doit faire au moins {{ limit }} caractères.')]
    #[Assert\Regex(
        pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.'
    )]
    public readonly string $password;

    public function __construct(string $name, string $email, string $password)
    {
        $this->name     = $name;
        $this->email    = $email;
        $this->password = $password;
    }
}
