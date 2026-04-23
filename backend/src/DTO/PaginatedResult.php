<?php

declare(strict_types=1);

namespace App\DTO;

/**
 * @class PaginatedResult
 * @description Value object encapsulant un résultat paginé avec ses métadonnées.
 *
 * Retourner un tableau brut depuis le Service forcerait le Controller
 * à connaître la structure interne. Ce VO normalise le contrat :
 * on sait toujours ce qu'on reçoit, quel que soit le Repository.
 *
 * @template T
 * @package App\DTO
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class PaginatedResult
{
    /**
     * @method __construct
     * @param {array}  $items      Éléments de la page courante
     * @param {int}    $total      Nombre total d'éléments toutes pages confondues
     * @param {int}    $page       Numéro de la page courante (base 1)
     * @param {int}    $perPage    Nombre d'éléments par page
     * @param {int}    $totalPages Nombre total de pages
     */
    public function __construct(
        public readonly array $items,
        public readonly int   $total,
        public readonly int   $page,
        public readonly int   $perPage,
        public readonly int   $totalPages,
    ) {}

    /**
     * @method toArray
     * @description Sérialise le résultat paginé pour la réponse JSON.
     * @returns {array<string, mixed>}
     */
    public function toArray(): array
    {
        return [
            'items'      => $this->items,
            'pagination' => [
                'total'       => $this->total,
                'page'        => $this->page,
                'per_page'    => $this->perPage,
                'total_pages' => $this->totalPages,
                'has_next'    => $this->page < $this->totalPages,
                'has_prev'    => $this->page > 1,
            ],
        ];
    }
}
