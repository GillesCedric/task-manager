<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Task;
use App\Interface\TaskRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @class TaskRepository
 * @description Repository tâches — pagination avec filtre optionnel par liste.
 *
 * @package App\Repository
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.1.0
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository implements TaskRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

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
    ): array {
        $allowedSorts  = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
        $allowedOrders = ['ASC', 'DESC'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort  = 'createdAt';
        }
        if (!in_array(strtoupper($order), $allowedOrders, true)) {
            $order = 'DESC';
        }

        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.taskList', 'l')
            ->leftJoin('l.members', 'm')
            ->leftJoin('m.user', 'mu')
            ->addSelect('l')
            ->where('(l.owner = :userId OR mu.id = :userId)')
            ->setParameter('userId', $ownerId);

        if ($listId !== null) {
            $qb->andWhere('l.id = :listId')->setParameter('listId', $listId);
        }
        if ($status   !== null) {
            $qb->andWhere('t.status = :status')->setParameter('status', $status);
        }
        if ($priority !== null) {
            $qb->andWhere('t.priority = :priority')->setParameter('priority', $priority);
        }
        if ($search   !== null && $search !== '') {
            $qb->andWhere('t.title LIKE :search OR t.description LIKE :search')
                ->setParameter('search', '%' . addcslashes($search, '%_') . '%');
        }

        $total = (clone $qb)->select('COUNT(DISTINCT t.id)')->getQuery()->getSingleScalarResult();

        $items = $qb
            ->select('t', 'l')
            ->distinct()
            ->orderBy("t.{$sort}", $order)
            ->setFirstResult(($page - 1) * $perPage)
            ->setMaxResults($perPage)
            ->getQuery()
            ->getResult();

        return ['items' => $items, 'total' => (int) $total];
    }

    public function findById(int $id): ?Task
    {
        return $this->find($id);
    }
    public function save(Task $task, bool $flush = true): void
    {
        $this->getEntityManager()->persist($task);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
    public function delete(Task $task, bool $flush = true): void
    {
        $this->getEntityManager()->remove($task);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
    public function getGlobalStats(): array
    {
        $conn   = $this->getEntityManager()->getConnection();
        $result = $conn->fetchAssociative("
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status='TODO'        THEN 1 ELSE 0 END) AS todo,
                SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN status='DONE'        THEN 1 ELSE 0 END) AS done,
                SUM(CASE WHEN priority='URGENT'    THEN 1 ELSE 0 END) AS urgent,
                SUM(CASE WHEN priority='HIGH'      THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN due_date IS NOT NULL AND due_date < NOW() AND status != 'DONE' THEN 1 ELSE 0 END) AS overdue,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_last_7_days
            FROM tasks
        ");
        return array_map('intval', $result ?: []);
    }

    public function getStatsByOwner(int $ownerId): array
    {
        $conn   = $this->getEntityManager()->getConnection();
        $sql    = "
            SELECT COUNT(DISTINCT t.id) AS total,
                   SUM(CASE WHEN t.status='todo'        THEN 1 ELSE 0 END) AS todo,
                   SUM(CASE WHEN t.status='in_progress' THEN 1 ELSE 0 END) AS in_progress,
                   SUM(CASE WHEN t.status='done'        THEN 1 ELSE 0 END) AS done,
                   SUM(CASE WHEN t.priority='urgent'    THEN 1 ELSE 0 END) AS urgent,
                   SUM(CASE WHEN t.priority='high'      THEN 1 ELSE 0 END) AS high,
                   SUM(CASE WHEN t.due_date IS NOT NULL AND t.due_date < NOW() AND t.status != 'done' THEN 1 ELSE 0 END) AS overdue
            FROM tasks t
            INNER JOIN task_lists l ON t.task_list_id = l.id
            LEFT JOIN task_list_members m ON m.task_list_id = l.id
            WHERE l.owner_id = :uid OR m.user_id = :uid
        ";
        $result = $conn->fetchAssociative($sql, ['uid' => $ownerId]);
        return array_map('intval', $result ?: []);
    }
}
