/**
 * @module utils/date
 * @description Utilitaires de formatage et de comparaison de dates avec support multilingue.
 *
 * Toutes les fonctions utilisent `date-fns` pour :
 * - Éviter les bugs de timezone du `Date` natif
 * - Bénéficier du support i18n (fr, en) pour les formats localisés
 * - Parser correctement les strings ISO 8601 retournées par l'API Symfony
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

import { format, formatDistanceToNow, isPast, Locale, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

/** Map des locales date-fns par code de langue i18next */
const LOCALES: Record<string, Locale> = { fr, en: enUS }

/**
 * Retourne la locale date-fns correspondant à la langue i18n active.
 * Fallback sur `fr` si la langue n'est pas supportée.
 *
 * @param lang - Code de langue i18next ('fr' | 'en')
 * @returns Locale date-fns
 */
export function getLocale(lang: string): Locale {
  return LOCALES[lang] ?? fr
}

/**
 * Formate une date ISO 8601 en date lisible localisée.
 *
 * @param isoDate - Date au format ISO 8601 (ex: "2026-01-16T09:30:00+00:00")
 * @param lang    - Code de langue cible ('fr' | 'en')
 * @returns Date formatée (ex: "16 janv. 2026" en FR, "Jan 16, 2026" en EN)
 *
 * @example
 * ```typescript
 * formatDate('2026-01-16T09:30:00Z', 'fr') // → "16 janv. 2026"
 * formatDate('2026-01-16T09:30:00Z', 'en') // → "Jan 16, 2026"
 * ```
 */
export function formatDate(isoDate: string, lang: string): string {
  try {
    return format(parseISO(isoDate), 'dd MMM yyyy', { locale: getLocale(lang) })
  } catch {
    return isoDate
  }
}

/**
 * Formate une date en temps relatif depuis maintenant.
 * Idéal pour les timestamps d'activité et les notifications.
 *
 * @param isoDate - Date au format ISO 8601
 * @param lang    - Code de langue cible
 * @returns Durée relative (ex: "il y a 2 heures", "2 hours ago")
 *
 * @example
 * ```typescript
 * formatRelative('2026-01-16T07:00:00Z', 'fr') // → "il y a 2 heures"
 * formatRelative('2026-01-16T07:00:00Z', 'en') // → "2 hours ago"
 * ```
 */
export function formatRelative(isoDate: string, lang: string): string {
  try {
    return formatDistanceToNow(parseISO(isoDate), {
      addSuffix: true,
      locale:    getLocale(lang),
    })
  } catch {
    return isoDate
  }
}

/**
 * Vérifie si une date d'échéance est dépassée.
 * Retourne `false` si la date est null (pas d'échéance définie).
 *
 * @param dueDate - Date d'échéance ISO 8601 ou null
 * @returns `true` si la date est dans le passé, `false` sinon
 *
 * @example
 * ```typescript
 * isOverdue('2025-01-01') // → true (date passée)
 * isOverdue(null)         // → false
 * ```
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  try { return isPast(parseISO(dueDate)) } catch { return false }
}
