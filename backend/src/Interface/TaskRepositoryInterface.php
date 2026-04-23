<?php

declare(strict_types=1);

namespace App\Interface;

use App\Entity\Task;

/**
 * @interface TaskRepositoryInterface
 * @description Contrat d'accès aux données pour les tâches avec support pagination et filtres.
 *
 * Le Service dépend uniquement de ce contrat — pas de TaskRepository directement.
 * Changer de stockage revient à écrire un nouveau Repository qui implémente
 * cette interface, sans toucher à la moindre ligne du Service.
 *
 * @package App\Interface
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
interface TaskRepositoryInterface
{
    /**
     * @method findPaginated
     * @description Retourne une page de tâches filtrées avec le total pour la pagination.
     *
     * @param {int}         $page     Numéro de page (base 1)
     * @param {int}         $perPage  Nombre d'éléments par page
     * @param {int}         $ownerId  Filtre propriétaire obligatoire
     * @param {string|null} $status   Filtre statut optionnel
     * @param {string|null} $priority Filtre priorité optionnel
     * @param {string|null} $search   Recherche full-text sur titre/description
     * @param {string}      $sort     Champ de tri
     * @param {string}      $order    Direction ASC/DESC
     * @returns {array{items: Task[], total: int}}
     */
    public function findPaginated(
        int     $page,
        int     $perPage,
        int     $ownerId,
        ?string $status   = null,
        ?string $priority = null,
        ?string $search   = null,
        string  $sort     = 'createdAt',
        string  $order    = 'DESC',
        ?int    $listId   = null,
    ): array;

    /**
     * @method findById
     * @description Retourne une tâche par ID, null si inexistante.
     * @param {int} $id
     * @returns {Task|null}
     */
    public function findById(int $id): ?Task;

    /**
     * @method save
     * @description Persiste une tâche en base (création ou mise à jour).
     * @param {Task} $task
     * @param {bool} $flush
     * @returns {void}
     */
    public function save(Task $task, bool $flush = true): void;

    /**
     * @method delete
     * @description Supprime une tâche de la base de données.
     * @param {Task} $task
     * @param {bool} $flush
     * @returns {void}
     */
    public function delete(Task $task, bool $flush = true): void;

    /**
     * @method getStatsByOwner
     * @description Retourne les statistiques agrégées des tâches d'un utilisateur.
     * Une seule requête SQL remplace N appels séparés.
     * @param {int} $ownerId
     * @returns {array<string, mixed>}
     */
    public function getStatsByOwner(int $ownerId): array;
}
