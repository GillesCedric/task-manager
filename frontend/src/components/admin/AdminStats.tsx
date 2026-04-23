import { useTranslation } from 'react-i18next'
import { Users, ListTodo, LayoutList, Activity, AlertTriangle, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { useAdminStats } from '@/hooks/useAdmin'
import type { AdminStats } from '@/types/admin'

/**
 * @module components/admin/AdminStats
 * @description Dashboard admin — statistiques globales avec graphes SVG.
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

// ─── Donut chart SVG ─────────────────────────────────────────────────────────

interface DonutSegment { value: number; color: string; label: string }

function DonutChart({ segments, size = 120 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={size/2 - 8} fill="none" stroke="#e2e8f0" strokeWidth={16} />
    </svg>
  )

  const r = size / 2 - 8
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference
        const gap  = circumference - dash
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            className="animate-stroke-draw"
            style={{
              '--stroke-total': circumference,
              animationDelay: `${i * 120}ms`,
            } as React.CSSProperties}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

// ─── Bar chart horizontal ─────────────────────────────────────────────────────

function BarChart({ bars }: { bars: { label: string; value: number; color: string; max: number }[] }) {
  return (
    <div className="space-y-2.5">
      {bars.map((bar, i) => {
        const pct = bar.max > 0 ? Math.round((bar.value / bar.max) * 100) : 0
        return (
          <div key={bar.label} className={`animate-fade-in animation-delay-${Math.min(i + 1, 8)}`}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">{bar.label}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{bar.value}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-bar-grow"
                style={{ width: `${pct}%`, backgroundColor: bar.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, bg }: {
  label: string; value: number | string; sub?: string
  icon: React.ReactNode; color: string; bg: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminStats() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />
      ))}
    </div>
  )

  if (!stats) return null

  const taskDonut: DonutSegment[] = [
    { value: stats.tasks.todo,        color: '#64748b', label: t('task.status.todo') },
    { value: stats.tasks.in_progress, color: '#3b82f6', label: t('task.status.in_progress') },
    { value: stats.tasks.done,        color: '#10b981', label: t('task.status.done') },
  ]

  const taskBars = [
    { label: t('task.status.todo'),        value: stats.tasks.todo,        color: '#64748b', max: stats.tasks.total },
    { label: t('task.status.in_progress'), value: stats.tasks.in_progress, color: '#3b82f6', max: stats.tasks.total },
    { label: t('task.status.done'),        value: stats.tasks.done,        color: '#10b981', max: stats.tasks.total },
    { label: t('task.overdue'),            value: stats.tasks.overdue,     color: '#ef4444', max: stats.tasks.total },
    { label: t('task.priority.urgent'),    value: stats.tasks.urgent,      color: '#f97316', max: stats.tasks.total },
  ]

  const logColors: Record<string, string> = {
    error: '#ef4444', warning: '#f59e0b', security: '#8b5cf6',
    info: '#3b82f6', debug: '#64748b',
  }
  const logBars = Object.entries(stats.logs).map(([lvl, cnt]) => ({
    label: lvl, value: cnt, color: logColors[lvl] ?? '#94a3b8',
    max: Math.max(...Object.values(stats.logs)),
  }))

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up animation-delay-1">
          <StatCard label={t('admin.totalUsers')} value={stats.users.total}
            sub={`+${stats.users.new_last_7_days} ${t('admin.last7days')}`}
            icon={<Users size={20} />}
            color="text-blue-600 dark:text-blue-400" bg="bg-blue-100 dark:bg-blue-900/40" />
        </div>
        <div className="animate-fade-in-up animation-delay-2">
          <StatCard label={t('admin.totalTasks')} value={stats.tasks.total}
            sub={`+${stats.tasks.new_last_7_days} ${t('admin.last7days')}`}
            icon={<ListTodo size={20} />}
            color="text-green-600 dark:text-green-400" bg="bg-green-100 dark:bg-green-900/40" />
        </div>
        <div className="animate-fade-in-up animation-delay-3">
          <StatCard label={t('admin.totalLists')} value={stats.lists.total}
            sub={`${stats.lists.shared} ${t('admin.shared')}`}
            icon={<LayoutList size={20} />}
            color="text-purple-600 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-900/40" />
        </div>
        <div className="animate-fade-in-up animation-delay-4">
          <StatCard label={t('admin.admins')} value={stats.users.admins}
            icon={<Activity size={20} />}
            color="text-orange-600 dark:text-orange-400" bg="bg-orange-100 dark:bg-orange-900/40" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut tâches */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> {t('admin.taskDistribution')}
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <DonutChart segments={taskDonut} size={110} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.tasks.total}</span>
                <span className="text-xs text-slate-400">{t('stats.total')}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {taskDonut.map(seg => (
                <div key={seg.label} className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">{seg.label}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart tâches */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> {t('admin.taskBreakdown')}
          </h3>
          <BarChart bars={taskBars} />
        </div>

        {/* Completion rate */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} /> {t('stats.completion')}
          </h3>
          {(() => {
            const pct = stats.tasks.total > 0 ? Math.round((stats.tasks.done / stats.tasks.total) * 100) : 0
            return (
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">{pct}%</span>
                  <span className="text-sm text-slate-400">{stats.tasks.done}/{stats.tasks.total}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-bar-grow" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" />{stats.tasks.overdue} {t('task.overdue')}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full" />{stats.tasks.urgent} {t('task.priority.urgent')}</span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Logs par niveau */}
        {logBars.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Clock size={14} /> {t('admin.logsByLevel')}
            </h3>
            <BarChart bars={logBars} />
          </div>
        )}
      </div>
    </div>
  )
}
