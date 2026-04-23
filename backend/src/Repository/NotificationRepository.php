<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @class NotificationRepository
 * @package App\Repository
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 * @extends ServiceEntityRepository<Notification>
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /**
     * @method findForUser
     * @description Retourne les N dernières notifications d'un utilisateur.
     *
     * @param {User} $user
     * @param {int}  $limit
     * @returns {Notification[]}
     */
    public function findForUser(User $user, int $limit = 20): array
    {
        return $this->createQueryBuilder('n')
            ->leftJoin('n.actor', 'a')
            ->addSelect('a')
            ->where('n.recipient = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @method countUnread
     * @description Compte les notifications non lues d'un utilisateur.
     *
     * @param {User} $user
     * @returns {int}
     */
    public function countUnread(User $user): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.recipient = :user AND n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @method markAllReadForUser
     * @param {User} $user
     */
    public function markAllReadForUser(User $user): void
    {
        $this->createQueryBuilder('n')
            ->update()
            ->set('n.isRead', 'true')
            ->where('n.recipient = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();
    }

    /**
     * @method save
     * @param {Notification} $n
     * @param {bool}         $flush
     */
    public function save(Notification $n, bool $flush = true): void
    {
        $this->getEntityManager()->persist($n);
        if ($flush) { $this->getEntityManager()->flush(); }
    }
}