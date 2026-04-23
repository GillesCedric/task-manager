import DOMPurify from 'dompurify'

/**
 * @module utils/sanitize
 * @description Sanitisation des données côté front via DOMPurify.
 *
 * DOMPurify est la référence industrie pour la prévention XSS navigateur.
 * On nettoie les données avant envoi à l'API, même depuis nos propres formulaires —
 * le principe "never trust user input" s'applique à tous les niveaux.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @function sanitizeString
 * @description Supprime tout HTML/JS dangereux d'une chaîne, ne conserve que le texte brut.
 *
 * @param {string} value Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée et trimée
 */
export function sanitizeString(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS:  [],
    ALLOWED_ATTR:  [],
    KEEP_CONTENT:  true,
  }).trim()
}

/**
 * @function sanitizePayload
 * @description Sanitise tous les champs string d'un objet payload avant envoi à l'API.
 * Les types non-string (number, boolean, null, undefined) sont retournés intacts.
 *
 * @template T extends Record<string, unknown>
 * @param {T} payload L'objet à nettoyer
 * @returns {T} L'objet avec les strings sanitisées
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === 'string' ? sanitizeString(value) : value,
    ])
  ) as T
}
