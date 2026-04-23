<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\TaskList;
use App\Entity\TaskListMember;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @class TaskListMemberRepository
 * @package App\Repository
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 * @extends ServiceEntityRepository<TaskListMember>
 */
class TaskListMemberRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TaskListMember::class);
    }

    /**
     * @method findMembership
     * @description Retourne l'appartenance d'un user à une liste, null si absent.
     *
     * @param {TaskList} $list
     * @param {User}     $user
     * @returns {TaskListMember|null}
     */
    public function findMembership(TaskList $list, User $user): ?TaskListMember
    {
        return $this->findOneBy(['taskList' => $list, 'user' => $user]);
    }

    /**
     * @method save
     * @param {TaskListMember} $member
     * @param {bool}           $flush
     */
    public function save(TaskListMember $member, bool $flush = true): void
    {
        $this->getEntityManager()->persist($member);
        if ($flush) { $this->getEntityManager()->flush(); }
    }

    /**
     * @method delete
     * @param {TaskListMember} $member
     */
    public function delete(TaskListMember $member): void
    {
        $this->getEntityManager()->remove($member);
        $this->getEntityManager()->flush();
    }
}