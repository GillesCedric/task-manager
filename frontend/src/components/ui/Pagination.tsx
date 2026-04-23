import { useTranslation }   from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button }           from './Button'
import type { PaginationMeta } from '@/types/task'

/**
 * @module components/ui/Pagination
 * @description Composant de pagination avec navigation et affichage du compteur.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

interface PaginationProps {
  meta:     PaginationMeta
  onPage:   (page: number) => void
  perPage:  number
  onPerPage:(n: number) => void
}

/**
 * @function Pagination
 * @description Barre de pagination avec boutons précédent/suivant, numéros de page et sélecteur.
 *
 * @param {PaginationProps} props
 * @returns {JSX.Element}
 */
export function Pagination({ meta, onPage, perPage, onPerPage }: PaginationProps) {
  const { t } = useTranslation()

  const from = (meta.page - 1) * meta.per_page + 1
  const to   = Math.min(meta.page * meta.per_page, meta.total)

  // Génère les numéros de page à afficher (avec ellipses)
  const pages: (number | '...')[] = []
  if (meta.total_pages <= 7) {
    for (let i = 1; i <= meta.total_pages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (meta.page > 3)                       pages.push('...')
    for (let i = Math.max(2, meta.page - 1); i <= Math.min(meta.total_pages - 1, meta.page + 1); i++) pages.push(i)
    if (meta.page < meta.total_pages - 2)    pages.push('...')
    pages.push(meta.total_pages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>{t('pagination.showing', { from, to, total: meta.total })}</span>
        <select
          value={perPage}
          onChange={e => onPerPage(Number(e.target.value))}
          className="ml-2 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
          aria-label={t('pagination.perPage')}
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPage(meta.page - 1)}
          disabled={!meta.has_prev} aria-label={t('pagination.previous')}>
          <ChevronLeft size={16} />
        </Button>

        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className="px-2 text-slate-400">…</span>
            : <button key={p} onClick={() => onPage(p as number)}
                className={[
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                  p === meta.page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
                ].join(' ')}
                aria-current={p === meta.page ? 'page' : undefined}
              >{p}</button>
        )}

        <Button variant="ghost" size="sm" onClick={() => onPage(meta.page + 1)}
          disabled={!meta.has_next} aria-label={t('pagination.next')}>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
