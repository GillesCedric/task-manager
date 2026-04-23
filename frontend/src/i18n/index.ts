import i18n               from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector     from 'i18next-browser-languagedetector'
import fr                   from './locales/fr.json'
import en                   from './locales/en.json'

/**
 * @module i18n
 * @description Configuration i18next avec détection automatique de la langue navigateur.
 *
 * La langue est persistée dans localStorage via LanguageDetector.
 * Le fallback sur 'fr' garantit qu'une clé manquante en anglais
 * affichera le texte français plutôt qu'une clé brute.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    interpolation: {
      escapeValue: false, // React gère déjà l'échappement XSS
    },
    detection: {
      order:  ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n_lang',
    },
  })

export default i18n
