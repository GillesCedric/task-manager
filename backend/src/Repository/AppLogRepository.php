<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\AppLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @class AppLogRepository
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */
class AppLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AppLog::class);
    }

    /**
     * @method findPaginated
     * @description Retourne les logs paginés avec filtre optionnel sur le niveau.
     */
    public function findPaginated(int $page, int $perPage, ?string $level = null): array
    {
        $qb = $this->createQueryBuilder('l')
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults($perPage)
            ->setFirstResult(($page - 1) * $perPage);

        if ($level) {
            $qb->andWhere('l.level = :level')->setParameter('level', $level);
        }

        $items = $qb->getQuery()->getResult();

        $countQb = $this->createQueryBuilder('l')->select('COUNT(l.id)');
        if ($level) {
            $countQb->andWhere('l.level = :level')->setParameter('level', $level);
        }
        $total = (int) $countQb->getQuery()->getSingleScalarResult();

        return ['items' => $items, 'total' => $total];
    }

    public function countByLevel(): array
    {
        $rows = $this->createQueryBuilder('l')
            ->select('l.level, COUNT(l.id) as cnt')
            ->groupBy('l.level')
            ->getQuery()
            ->getResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['level']] = (int) $row['cnt'];
        }
        return $result;
    }
}
