<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @class UserRepository
 * @description Repository Doctrine pour l'entité User avec rehachage automatique.
 *
 * PasswordUpgraderInterface permet à Symfony Security de migrer les hachages
 * vers un algorithme plus fort dès que l'utilisateur se connecte.
 *
 * @package App\Repository
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * @method upgradePassword
     * @description Rehache le mot de passe avec l'algorithme courant si l'ancien est obsolète.
     *
     * @param {PasswordAuthenticatedUserInterface} $user
     * @param {string}                             $newHashedPassword
     * @returns {void}
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /**
     * @method findByEmail
     * @description Recherche un utilisateur par email (insensible à la casse).
     *
     * @param {string} $email
     * @returns {User|null}
     */
    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => strtolower(trim($email))]);
    }

    /**
     * @method save
     * @description Persiste un utilisateur.
     *
     * @param {User} $user
     * @param {bool} $flush
     * @returns {void}
     */
    public function save(User $user, bool $flush = true): void
    {
        $this->getEntityManager()->persist($user);
        if ($flush) { $this->getEntityManager()->flush(); }
    }

    public function delete(User $user): void
    {
        $this->getEntityManager()->remove($user);
        $this->getEntityManager()->flush();
    }

    public function findPaginated(int $page, int $perPage, ?string $search = null): array
    {
        $qb = $this->createQueryBuilder('u')->orderBy('u.createdAt', 'DESC')
            ->setMaxResults($perPage)->setFirstResult(($page - 1) * $perPage);

        if ($search) {
            $qb->andWhere('u.name LIKE :s OR u.email LIKE :s')
               ->setParameter('s', '%' . addcslashes($search, '%_') . '%');
        }

        $items = $qb->getQuery()->getResult();
        $countQb = $this->createQueryBuilder('u')->select('COUNT(u.id)');
        if ($search) {
            $countQb->andWhere('u.name LIKE :s OR u.email LIKE :s')
                    ->setParameter('s', '%' . addcslashes($search, '%_') . '%');
        }
        $total = (int) $countQb->getQuery()->getSingleScalarResult();

        return ['items' => $items, 'total' => $total];
    }

    public function getStats(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $row  = $conn->fetchAssociative("
            SELECT
                COUNT(*) AS total,
                SUM(JSON_CONTAINS(roles, '\"ROLE_ADMIN\"')) AS admins,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_last_7_days
            FROM users
        ");
        return array_map('intval', $row ?: []);
    }
}
