<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * @class RateLimitListener
 * @description Rate limiting sur /api/ — protection DDoS et brute-force.
 *
 * Deux niveaux :
 *   - Global  : 200 req/min par IP (bots et crawlers agressifs)
 *   - Auth    : 10 req/min par IP sur /api/auth/ (brute-force login)
 *
 * Priorité 10 sur kernel.REQUEST — s'exécute avant le routing Symfony.
 * Plus on bloque tôt, moins on consomme de ressources.
 *
 * @package App\EventListener
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 10)]
final class RateLimitListener
{
    /**
     * @method __construct
     * @param {RateLimiterFactory} $apiGlobalLimiter 200 req/min
     * @param {RateLimiterFactory} $apiAuthLimiter   10 req/min sur /auth/
     */
    public function __construct(
        private readonly RateLimiterFactory $apiGlobalLimiter,
        private readonly RateLimiterFactory $apiAuthLimiter,
    ) {}

    /**
     * @method __invoke
     * @description Vérifie les quotas et bloque avec 429 si dépassés.
     *
     * @param {RequestEvent} $event
     * @returns {void}
     */
    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $path    = $request->getPathInfo();

        if (!str_starts_with($path, '/api/')) { return; }

        $ip     = $request->getClientIp() ?? 'unknown';
        $global = $this->apiGlobalLimiter->create($ip)->consume(1);

        if (!$global->isAccepted()) {
            $event->setResponse($this->tooManyRequests(
                'Trop de requêtes. Réessayez dans un instant.',
                $global->getRetryAfter()
            ));
            return;
        }

        if (str_starts_with($path, '/api/auth/')) {
            $auth = $this->apiAuthLimiter->create($ip)->consume(1);
            if (!$auth->isAccepted()) {
                $event->setResponse($this->tooManyRequests(
                    'Trop de tentatives. Réessayez dans un instant.',
                    $auth->getRetryAfter()
                ));
            }
        }
    }

    /**
     * @method tooManyRequests
     * @description Construit la réponse HTTP 429 avec header Retry-After (RFC 6585).
     *
     * @param {string}             $message
     * @param {\DateTimeImmutable} $retryAfter
     * @returns {JsonResponse}
     */
    private function tooManyRequests(string $message, \DateTimeImmutable $retryAfter): JsonResponse
    {
        return new JsonResponse(
            ['success' => false, 'error' => $message],
            Response::HTTP_TOO_MANY_REQUESTS,
            ['Retry-After' => $retryAfter->getTimestamp() - time()],
        );
    }
}
