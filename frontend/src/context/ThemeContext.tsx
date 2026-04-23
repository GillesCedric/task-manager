import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * @module context/ThemeContext
 * @description Gestion du thème (light / dark / auto) avec persistance localStorage.
 *
 * La classe "dark" est appliquée sur <html> — c'est ce que lit le
 * @custom-variant dark déclaré dans index.css pour Tailwind v4.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextValue {
  theme:    Theme
  setTheme: (t: Theme) => void
  isDark:   boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * @function applyDark
 * @description Applique ou retire la classe "dark" sur <html> de façon atomique.
 * On force aussi l'attribut color-scheme pour que les éléments natifs
 * du navigateur (scrollbar, inputs) s'adaptent aussi.
 *
 * @param {boolean} dark
 */
function applyDark(dark: boolean): void {
  const root = document.documentElement
  if (dark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

/**
 * @function ThemeProvider
 * @description Provider du contexte thème — à placer en haut de l'arbre React.
 *
 * @param {{ children: ReactNode }} props
 * @returns {JSX.Element}
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) ?? 'auto'
  })

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme') as Theme
    if (stored === 'dark')  return true
    if (stored === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (theme === 'auto') {
      const mq      = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        setIsDark(e.matches)
        applyDark(e.matches)
      }
      setIsDark(mq.matches)
      applyDark(mq.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      const dark = theme === 'dark'
      setIsDark(dark)
      applyDark(dark)
    }
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * @function useTheme
 * @description Hook d'accès au contexte thème.
 * @returns {ThemeContextValue}
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}