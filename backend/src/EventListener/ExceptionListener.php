<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * @class ExceptionListener
 * @description Intercepte toutes les exceptions et les transforme en JSON cohérent.
 *
 * Les erreurs 5xx ne retournent JAMAIS le message interne — cela exposerait
 * la stack technique à un attaquant. Seules les exceptions HTTP (4xx)
 * retournent leur message, car elles sont conçues pour être lisibles.
 *
 * @package App\EventListener
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
#[AsEventListener(event: KernelEvents::EXCEPTION)]
final class ExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        $exception  = $event->getThrowable();
        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : Response::HTTP_INTERNAL_SERVER_ERROR;

        // 5xx : ne jamais exposer les détails internes
        $message = $statusCode >= 500
            ? 'Une erreur interne est survenue. Veuillez réessayer.'
            : $exception->getMessage();

        $headers = $exception instanceof HttpExceptionInterface
            ? $exception->getHeaders()
            : [];

        $event->setResponse(new JsonResponse(
            ['success' => false, 'error' => $message],
            $statusCode,
            $headers,
        ));
    }
}
