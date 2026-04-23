import { useState, useRef, useEffect } from 'react'
import { useTranslation }              from 'react-i18next'
import { Bell }                        from 'lucide-react'
import { useNotifications, useReadAllNotifications } from '@/hooks/useNotification'
import { formatRelative }              from '@/utils/date'

/**
 * @module components/notifications/NotificationBell
 * @description Cloche de notifications avec dropdown et badge de non-lus.
 * Polling automatique toutes les 30 secondes.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

/**
 * @function NotificationBell
 * @returns {JSX.Element}
 */
export function NotificationBell() {
  const { t, i18n } = useTranslation()
  const [open, setOpen]     = useState(false)
  const dropdownRef         = useRef<HTMLDivElement>(null)

  const { data }     = useNotifications()
  const readAll      = useReadAllNotifications()

  const notifications = data?.data          ?? []
  const unreadCount   = data?.unread_count  ?? 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open && unreadCount > 0) readAll.mutate()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        aria-label={`${t('notifications.title')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-bell-shake' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none animate-bounce-dot">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{t('notifications.title')}</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">{t('notifications.empty')}</p>
            ) : (
              notifications.map((notif, i) => (
                <div key={notif.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={[
                    'px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 animate-slide-right',
                    !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : '',
                  ].join(' ')}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                      {notif.actor?.avatarUrl
                        ? <img src={notif.actor.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : (notif.actor?.name?.slice(0, 2).toUpperCase() ?? '?')
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {t(`notifications.types.${notif.type}`, { defaultValue: notif.type })}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {notif.actor?.name} · {(notif.payload as { list_name?: string }).list_name ?? (notif.payload as { task_title?: string }).task_title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatRelative(notif.createdAt, i18n.language)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
