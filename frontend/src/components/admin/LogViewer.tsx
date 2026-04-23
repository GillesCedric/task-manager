import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronR, ShieldAlert, User as UserIcon, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { useAdminLogs, useClearLogs } from '@/hooks/useAdmin'
import { formatRelative } from '@/utils/date'

/**
 * @module components/admin/LogViewer
 * @description Visionneuse de l'audit trail — actions utilisateur et événements sécurité.
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

const LEVEL_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
  action:   { badge: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',   icon: <Zap size={11} /> },
  security: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: <ShieldAlert size={11} /> },
  error:    { badge: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',    icon: <ShieldAlert size={11} /> },
}

const LEVELS = ['', 'action', 'security', 'error']
const LEVELS_LABELS: Record<string, string> = { '': 'Tous', action: 'Actions', security: 'Sécurité', error: 'Erreurs' }

const ACTION_COLORS: Record<string, string> = {
  'auth.':     'text-green-600  dark:text-green-400',
  'task.':     'text-blue-600   dark:text-blue-400',
  'tasklist.': 'text-purple-600 dark:text-purple-400',
  'admin.':    'text-orange-600 dark:text-orange-400',
  'security.': 'text-red-600    dark:text-red-400',
}

function actionColor(action: string): string {
  for (const [prefix, cls] of Object.entries(ACTION_COLORS)) {
    if (action.startsWith(prefix)) return cls
  }
  return 'text-slate-600 dark:text-slate-400'
}

interface LogEntry {
  id: number
  action: string
  level: string
  userId: number | null
  userName: string | null
  resourceType: string | null
  resourceId: number | null
  ipAddress: string | null
  durationMs: number | null
  metadata: Record<string, unknown>
  createdAt: string
}

function LogRow({ log, lang }: { log: LogEntry; lang: string }) {
  const [open, setOpen] = useState(false)
  const style    = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.action
  const hasMeta  = Object.keys(log.metadata).length > 0

  return (
    <div className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div
        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
        onClick={() => hasMeta && setOpen(v => !v)}
      >
        {/* Level */}
        <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${style.badge}`}>
          {style.icon} {log.level.toUpperCase()}
        </span>

        {/* Action + resource */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-mono font-semibold ${actionColor(log.action)}`}>{log.action}</span>
            {log.resourceType && log.resourceId && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {log.resourceType}#{log.resourceId}
              </span>
            )}
          </div>

          {/* User + IP + time */}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
            {log.userName && (
              <span className="flex items-center gap-1">
                <UserIcon size={10} /> {log.userName}
              </span>
            )}
            {log.ipAddress && <span>{log.ipAddress}</span>}
            {log.durationMs !== null && <span>{log.durationMs}ms</span>}
            <span>{formatRelative(log.createdAt, lang)}</span>
          </div>
        </div>

        {hasMeta && (
          <span className="shrink-0 text-slate-400 mt-1">
            {open ? <ChevronDown size={13} /> : <ChevronR size={13} />}
          </span>
        )}
      </div>

      {open && hasMeta && (
        <div className="px-4 pb-3">
          <pre className="text-xs bg-slate-900 dark:bg-slate-950 text-green-400 p-3 rounded-lg overflow-x-auto leading-relaxed">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function LogViewer() {
  const { t, i18n } = useTranslation()
  const [page,   setPage]   = useState(1)
  const [level,  setLevel]  = useState('')
  const clearLogs = useClearLogs()

  const { data, isLoading, refetch } = useAdminLogs(page, level || undefined)

  const handleClear = async () => {
    if (!window.confirm(t('admin.confirmClearLogs'))) return
    await clearLogs.mutateAsync(level || undefined)
    toast.success(t('admin.logsCleared'))
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {LEVELS.map(lvl => (
            <button
              key={lvl || 'all'}
              onClick={() => { setLevel(lvl); setPage(1) }}
              className={[
                'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                level === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600',
              ].join(' ')}
            >
              {LEVELS_LABELS[lvl]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} /> {t('actions.refresh')}
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleClear}
            isLoading={clearLogs.isPending}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700"
          >
            <Trash2 size={13} /> {t('admin.clearLogs')}
          </Button>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 border-b border-slate-100 dark:border-slate-700 animate-pulse bg-slate-50 dark:bg-slate-700/30" />
            ))
          : (data?.data?.length ?? 0) === 0
            ? <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-12">{t('admin.noLogs')}</p>
            : (data?.data as unknown as LogEntry[]).map(log => (
                <LogRow key={log.id} log={log} lang={i18n.language} />
              ))
        }
      </div>

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {t('pagination.showing', {
              from:  (page - 1) * 50 + 1,
              to:    Math.min(page * 50, data.pagination.total),
              total: data.pagination.total,
            })}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft size={14} /></Button>
            <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.total_pages}><ChevronRight size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
