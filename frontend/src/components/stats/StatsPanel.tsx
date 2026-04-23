import { useTranslation }  from 'react-i18next'
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Zap, TrendingUp } from 'lucide-react'
import { useTaskStats }    from '@/hooks/useTask'

/**
 * @module components/stats/StatsPanel
 * @description Tableau de bord statistiques avec indicateurs visuels.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @function StatsPanel
 * @description Grille de cartes statistiques pour le dashboard utilisateur.
 * Données mises en cache 60s — pas de re-fetch intempestif.
 *
 * @returns {JSX.Element}
 */
export function StatsPanel() {
  const { t }                          = useTranslation()
  const { data: stats, isLoading }     = useTaskStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const completion = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0

  const cards = [
    { label: t('stats.total'),      value: stats.total,         icon: <ListTodo    size={20} />, color: 'text-slate-600 dark:text-slate-300',  bg: 'bg-slate-100 dark:bg-slate-700' },
    { label: t('stats.todo'),       value: stats.todo,          icon: <Clock       size={20} />, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: t('stats.inProgress'), value: stats.in_progress,   icon: <TrendingUp  size={20} />, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    { label: t('stats.done'),       value: stats.done,          icon: <CheckCircle2 size={20}/>, color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-100 dark:bg-green-900/40' },
    { label: t('stats.overdue'),    value: stats.overdue,       icon: <AlertTriangle size={20}/>, color: 'text-red-600 dark:text-red-400',   bg: 'bg-red-100 dark:bg-red-900/40' },
    { label: t('stats.urgent'),     value: stats.urgent,        icon: <Zap         size={20} />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  ]

  return (
    <div className="space-y-4">
      {/* Taux de complétion */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('stats.completion')}</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{completion}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
            role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}
          />
        </div>
      </div>

      {/* Grille de stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <div key={card.label}
            className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center text-center gap-2 animate-fade-in-up animation-delay-${Math.min(i + 1, 8)}`}>
            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color} animate-count-up animation-delay-${Math.min(i + 1, 8)}`}>{card.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
