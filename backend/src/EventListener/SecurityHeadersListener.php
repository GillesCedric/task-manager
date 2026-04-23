<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * @class SecurityHeadersListener
 * @description Injecte les headers de sécurité OWASP sur chaque réponse HTTP.
 *
 * Centralisé ici plutôt que dans Nginx pour être actif en dev local
 * et dans les tests fonctionnels. Les headers couvrent les principales
 * attaques navigateur : clickjacking, MIME sniffing, XSS, HSTS.
 *
 * On supprime aussi Server et X-Powered-By pour ne pas révéler la stack.
 *
 * @package App\EventListener
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
#[AsEventListener(event: KernelEvents::RESPONSE)]
final class SecurityHeadersListener
{
    /**
     * @method __invoke
     * @description Ajoute les security headers sur la réponse principale uniquement.
     *
     * @param {ResponseEvent} $event
     * @returns {void}
     */
    public function __invoke(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) { return; }

        $h = $event->getResponse()->headers;
        $h->set('X-Content-Type-Options',    'nosniff');
        $h->set('X-Frame-Options',           'DENY');
        $h->set('X-XSS-Protection',          '1; mode=block');
        $h->set('Referrer-Policy',           'strict-origin-when-cross-origin');
        $h->set('Content-Security-Policy',   "default-src 'none'");
        $h->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        $h->set('Permissions-Policy',        'geolocation=(), camera=(), microphone=()');
        $h->remove('X-Powered-By');
        $h->remove('Server');
    }
}
