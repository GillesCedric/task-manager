import { useState } from 'react'
import { Navigate }  from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart2, Users, ScrollText } from 'lucide-react'
import { useAuth }      from '@/context/AuthContext'
import { AdminStats }   from '@/components/admin/AdminStats'
import { UserTable }    from '@/components/admin/UserTable'
import { LogViewer }    from '@/components/admin/LogViewer'

/**
 * @module pages/AdminPage
 * @description Panel d'administration — stats, utilisateurs, logs.
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

type Tab = 'stats' | 'users' | 'logs'

const TABS: { id: Tab; icon: React.ReactNode; labelKey: string }[] = [
  { id: 'stats', icon: <BarChart2 size={15} />, labelKey: 'admin.tabStats'  },
  { id: 'users', icon: <Users     size={15} />, labelKey: 'admin.tabUsers'  },
  { id: 'logs',  icon: <ScrollText size={15}/>, labelKey: 'admin.tabLogs'   },
]

export function AdminPage() {
  const { t }    = useTranslation()
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<Tab>('stats')

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
            <Users size={20} />
          </span>
          {t('nav.admin')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('admin.subtitle')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {TABS.map(({ id, icon, labelKey }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            ].join(' ')}
          >
            {icon} {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={tab} className="animate-fade-in-up">
        {tab === 'stats' && <AdminStats />}
        {tab === 'users' && <UserTable />}
        {tab === 'logs'  && <LogViewer />}
      </div>
    </div>
  )
}
