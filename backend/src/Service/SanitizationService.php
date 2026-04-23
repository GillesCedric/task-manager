<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\HtmlSanitizer\HtmlSanitizerInterface;

/**
 * @class SanitizationService
 * @description Nettoyage des données entrantes pour prévenir les injections XSS.
 *
 * S'appuie sur symfony/html-sanitizer — bien plus robuste que strip_tags()
 * qui peut laisser passer des injections dans des cas limites (attributs onclick,
 * data URI schemes, SVG avec JS embarqué...).
 *
 * Ordre invariable dans le pipeline : sanitiser → valider → traiter.
 * Les contraintes Assert s'appliquent sur des données déjà propres.
 *
 * @package App\Service
 * @author  Gilles Cédric <nguefackgilles@gmail.com>
 * @since   1.0.0
 */
final class SanitizationService
{
    /**
     * @method __construct
     * @param {HtmlSanitizerInterface} $htmlSanitizer Injecté depuis html_sanitizer.yaml
     */
    public function __construct(
        private readonly HtmlSanitizerInterface $htmlSanitizer,
    ) {}

    /**
     * @method sanitizeString
     * @description Nettoie une chaîne en supprimant tout HTML non autorisé.
     * Retourne null si l'entrée est null — on ne convertit pas null en chaîne vide.
     *
     * @param {string|null} $value
     * @returns {string|null}
     */
    public function sanitizeString(?string $value): ?string
    {
        if ($value === null) { return null; }
        return trim($this->htmlSanitizer->sanitizeFor('body', $value));
    }

    /**
     * @method sanitizeArray
     * @description Sanitise tous les champs string d'un tableau associatif.
     * Les types non-string (int, bool, null) sont retournés intacts.
     *
     * @param {array<string, mixed>} $data
     * @returns {array<string, mixed>}
     */
    public function sanitizeArray(array $data): array
    {
        return array_map(
            fn(mixed $v) => is_string($v) ? $this->sanitizeString($v) : $v,
            $data,
        );
    }
}
