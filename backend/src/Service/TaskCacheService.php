<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\PaginatedResult;
use Psr\Cache\InvalidArgumentException;
use Symfony\Contracts\Cache\TagAwareCacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * @class TaskCacheService
 * @description Cache applicatif pour les tâches — pattern Cache-Aside avec isolation par user.
 *
 * Chaque utilisateur a ses propres tags de cache : `task_list_user_{id}` et
 * `task_stats_user_{id}`. L'invalidation est donc chirurgicale : un write
 * d'un user n'invalide que son propre cache, pas celui des autres.
 *
 * @package App\Service
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class TaskCacheService
{
    private const TTL_LIST  = 60;
    private const TTL_STATS = 120;

    public function __construct(
        private readonly TagAwareCacheInterface $taskCachePool,
    ) {}

    public function getTaskList(string $cacheKey, int $userId, callable $callback): PaginatedResult
    {
        return $this->taskCachePool->get(
            $cacheKey,
            function (ItemInterface $item) use ($userId, $callback): PaginatedResult {
                $item->expiresAfter(self::TTL_LIST);
                $item->tag([$this->listTag($userId)]);
                return $callback();
            }
        );
    }

    public function getStats(int $userId, callable $callback): array
    {
        return $this->taskCachePool->get(
            "task_stats_{$userId}",
            function (ItemInterface $item) use ($userId, $callback): array {
                $item->expiresAfter(self::TTL_STATS);
                $item->tag([$this->statsTag($userId)]);
                return $callback();
            }
        );
    }

    public function buildListKey(
        int     $userId,
        int     $page,
        int     $perPage,
        ?string $status,
        ?string $priority,
        ?string $search,
        string  $sort,
        string  $order,
    ): string {
        return sprintf(
            'task_list_%d_%d_%d_%s_%s_%s_%s_%s',
            $userId,
            $page,
            $perPage,
            $status   ?? 'all',
            $priority ?? 'all',
            $search   ? md5($search) : 'no',
            $sort,
            $order
        );
    }

    /**
     * Invalide uniquement le cache du user concerné — les autres users ne sont pas impactés.
     */
    public function invalidateUserCache(int $userId): void
    {
        try {
            $this->taskCachePool->invalidateTags([
                $this->listTag($userId),
                $this->statsTag($userId),
            ]);
        } catch (InvalidArgumentException) {
            // Une invalidation ratée n'est pas critique
        }
    }

    private function listTag(int $userId): string  { return "task_list_user_{$userId}"; }
    private function statsTag(int $userId): string { return "task_stats_user_{$userId}"; }
}
