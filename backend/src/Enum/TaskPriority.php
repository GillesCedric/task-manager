<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * @enum TaskPriority
 * @description Niveau de priorité d'une tâche, du plus bas au plus critique.
 *
 * @package App\Enum
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
enum TaskPriority: string
{
    case LOW    = 'LOW';
    case MEDIUM = 'MEDIUM';
    case HIGH   = 'HIGH';
    case URGENT = 'URGENT';

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
