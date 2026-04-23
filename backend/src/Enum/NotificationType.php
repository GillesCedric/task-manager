<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * @enum NotificationType
 * @description Type de notification.
 *
 * @package App\Enum
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
enum NotificationType: string
{
    case TYPE_INVITE          = 'INVITE';
    case TYPE_TASK_ASSIGNED   = 'TASK_ASSIGNED';
    case TYPE_TASK_UPDATED    = 'TASK_UPDATED';
    case TYPE_MEMBER_JOINED   = 'MEMBER_JOINED';
    case TYPE_MEMBER_LEFT     = 'MEMBER_LEFT';

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
