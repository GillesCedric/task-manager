<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * @enum TaskListRole
 * @description Rôle d'un utilisateur dans une liste de tâches.
 *
 * @package App\Enum
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
enum TaskListRole: string
{
    case EDITOR    = 'EDITOR';
    case READER = 'READER';

    /**
     * @method values
     * @description Liste les valeurs valides pour la validation des DTOs.
     * @returns {string[]}
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
