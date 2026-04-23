<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * @enum TaskStatus
 * @description Backed enum représentant les statuts du cycle de vie d'une tâche.
 *
 * PHP 8.1+ backed enum — Doctrine 3.x gère la sérialisation string ↔ enum
 * nativement via l'option enumType sur la colonne. Fini les constantes
 * éparpillées et les erreurs de frappe sur les valeurs brutes.
 *
 * @package App\Enum
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
enum TaskStatus: string
{
    /** Tâche créée, en attente de traitement */
    case TODO        = 'TODO';

    /** Tâche actuellement en cours */
    case IN_PROGRESS = 'IN_PROGRESS';

    /** Tâche terminée et validée */
    case DONE        = 'DONE';

    /**
     * @method values
     * @description Retourne toutes les valeurs string — utilisé dans les contraintes Assert\Choice.
     * @returns {string[]}
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
