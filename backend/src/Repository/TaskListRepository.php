<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TaskList;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @class TaskListRepository
 * @description Repository pour les listes de tâches avec requêtes d'accès membres.
 *
 * @package App\Repository
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 * @extends ServiceEntityRepository<TaskList>
 */
class TaskListRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TaskList::class);
    }

    /**
     * @method findAccessibleByUser
     * @description Retourne toutes les listes accessibles pour un utilisateur :
     * celles qu'il a créées + celles dont il est membre.
     *
     * @param {User} $user
     * @returns {TaskList[]}
     */
    public function findAccessibleByUser(User $user): array
    {
        return $this->createQueryBuilder('l')
            ->leftJoin('l.members', 'm')
            ->leftJoin('m.user', 'u')
            ->where('l.owner = :user')
            ->orWhere('u = :user')
            ->setParameter('user', $user)
            ->orderBy('l.updatedAt', 'DESC')
            ->distinct()
            ->getQuery()
            ->getResult();
    }

    /**
     * @method findByInviteToken
     * @description Trouve une liste par son token d'invitation.
     *
     * @param {string} $token
     * @returns {TaskList|null}
     */
    public function findByInviteToken(string $token): ?TaskList
    {
        return $this->findOneBy(['inviteToken' => $token]);
    }

    /**
     * @method save
     * @param {TaskList} $list
     * @param {bool}     $flush
     */
    public function save(TaskList $list, bool $flush = true): void
    {
        $this->getEntityManager()->persist($list);
        if ($flush) { $this->getEntityManager()->flush(); }
    }

    /**
     * @method delete
     * @param {TaskList} $list
     */
    public function delete(TaskList $list): void
    {
        $this->getEntityManager()->remove($list);
        $this->getEntityManager()->flush();
    }

    public function getStats(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $row  = $conn->fetchAssociative("
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN invite_token IS NOT NULL THEN 1 ELSE 0 END) AS shared,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_last_7_days
            FROM task_lists
        ");
        return array_map('intval', $row ?: []);
    }
}