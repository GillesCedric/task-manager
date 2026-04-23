<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ActionLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @class ActionLogRepository
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @extends ServiceEntityRepository<ActionLog>
 */
class ActionLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ActionLog::class);
    }

    /**
     * Pagination avec filtres optionnels — pour l'admin UI.
     *
     * @return array{items: ActionLog[], total: int}
     */
    public function findPaginated(
        int     $page,
        int     $perPage,
        ?string $level       = null,
        ?string $action      = null,
        ?int    $userId      = null,
        ?string $search      = null,
    ): array {
        $qb = $this->createQueryBuilder('l')
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults($perPage)
            ->setFirstResult(($page - 1) * $perPage);

        if ($level)  { $qb->andWhere('l.level = :level')->setParameter('level', $level); }
        if ($action) { $qb->andWhere('l.action LIKE :action')->setParameter('action', $action . '%'); }
        if ($userId) { $qb->andWhere('l.userId = :uid')->setParameter('uid', $userId); }
        if ($search) {
            $qb->andWhere('l.action LIKE :s OR l.userName LIKE :s OR l.resourceType LIKE :s')
               ->setParameter('s', '%' . addcslashes($search, '%_') . '%');
        }

        $items = $qb->getQuery()->getResult();

        $countQb = $this->createQueryBuilder('l')->select('COUNT(l.id)');
        if ($level)  { $countQb->andWhere('l.level = :level')->setParameter('level', $level); }
        if ($action) { $countQb->andWhere('l.action LIKE :action')->setParameter('action', $action . '%'); }
        if ($userId) { $countQb->andWhere('l.userId = :uid')->setParameter('uid', $userId); }
        if ($search) {
            $countQb->andWhere('l.action LIKE :s OR l.userName LIKE :s OR l.resourceType LIKE :s')
                    ->setParameter('s', '%' . addcslashes($search, '%_') . '%');
        }
        $total = (int) $countQb->getQuery()->getSingleScalarResult();

        return ['items' => $items, 'total' => $total];
    }

    /** Statistiques pour le dashboard admin */
    public function getStats(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        return $conn->fetchAllAssociative("
            SELECT
                action,
                level,
                COUNT(*)                                                          AS count,
                COUNT(DISTINCT user_id)                                           AS unique_users,
                MAX(created_at)                                                   AS last_at
            FROM action_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY action, level
            ORDER BY count DESC
            LIMIT 20
        ");
    }

    /** Comptage par level pour les KPI cards */
    public function countByLevel(): array
    {
        $rows = $this->createQueryBuilder('l')
            ->select('l.level, COUNT(l.id) as cnt')
            ->groupBy('l.level')
            ->getQuery()
            ->getResult();

        return array_column($rows, 'cnt', 'level');
    }

    public function save(ActionLog $log, bool $flush = true): void
    {
        $this->getEntityManager()->persist($log);
        if ($flush) { $this->getEntityManager()->flush(); }
    }
}
