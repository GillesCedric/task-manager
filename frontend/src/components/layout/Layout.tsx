import { type ReactNode, useState }  from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation }            from 'react-i18next'
import { LayoutDashboard, LogOut, Moon, Sun, Monitor, Globe, Menu, X, Plus, ShieldCheck } from 'lucide-react'
import { useAuth }           from '@/context/AuthContext'
import { useTheme, type Theme } from '@/context/ThemeContext'
import { useTaskLists, useCreateList } from '@/hooks/useTaskList'
import { NotificationBell }  from '@/components/notifications/NotificationBell'
import { ListSettingsPanel } from '@/components/tasks/ListSettingsPanel'
import { CreateListModal }  from '@/components/layout/CreateListModal'
import { Avatar }            from '@/components/ui/Avatar'
import type { TaskListSummary } from '@/types/taskList'

/**
 * @module components/layout/Layout
 * @description Layout responsive avec sidebar mobile et gestion des listes.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

interface LayoutProps {
  children:      ReactNode
  activeList?:   TaskListSummary | null
  onSelectList?: (list: TaskListSummary) => void
}

const THEME_ICONS: Record<Theme, ReactNode> = {
  light: <Sun size={14} />, dark: <Moon size={14} />, auto: <Monitor size={14} />,
}


/**
 * @function Layout
 * @param {LayoutProps} props
 * @returns {JSX.Element}
 */
export function Layout({ children, activeList, onSelectList }: LayoutProps) {
  const { t, i18n }          = useTranslation()
  const { user, logout, isAdmin } = useAuth()
  const { theme, setTheme }  = useTheme()
  const location             = useLocation()
  const navigate             = useNavigate()
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [createListOpen,   setCreateListOpen]   = useState(false)

  const { data: lists = [] }   = useTaskLists()
  const createList              = useCreateList()

  const themes: Theme[] = ['light', 'dark', 'auto']
  const langs           = [{ code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }]

  const handleCreateList = async (name: string, color: string, description: string) => {
    const created = await createList.mutateAsync({ name, color, description: description || undefined })
    onSelectList?.(created)
    setCreateListOpen(false)
    setSidebarOpen(false)
  }

  const closeSidebar = () => setSidebarOpen(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo + bouton fermer (mobile) */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">TM</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 dark:text-white text-sm">{t('app.name')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.name}</p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2 pt-2 shrink-0">
        <Link to="/dashboard" onClick={closeSidebar}
          className={[
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            location.pathname === '/dashboard'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
          ].join(' ')}>
          <LayoutDashboard size={16} />{t('nav.dashboard')}
        </Link>
        {isAdmin && (
          <Link to="/admin" onClick={closeSidebar}
            className={[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              location.pathname.startsWith('/admin')
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}>
            <ShieldCheck size={16} />{t('nav.admin')}
          </Link>
        )}
      </nav>

      {/* Listes */}
      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        <div className="flex items-center justify-between px-3 py-1.5 mb-1">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('list.myLists')}
          </p>
          <button
            onClick={() => setCreateListOpen(true)}
            disabled={createList.isPending}
            className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
            aria-label="Créer une liste"
            title="Nouvelle liste"
          >
            <Plus size={13} />
          </button>
        </div>

        {lists.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
            {t('list.noLists')}
          </p>
        )}

        {lists.map((list, i) => (
          <div
            key={list.id}
            className={`group flex items-center rounded-lg transition-colors animate-slide-left animation-delay-${Math.min(i + 1, 8)}`}
          >
            <button
              onClick={() => {
                onSelectList?.(list)
                closeSidebar()
                if (location.pathname !== '/dashboard') navigate('/dashboard')
              }}
              className={[
                'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors min-w-0',
                activeList?.id === list.id
                  ? 'bg-slate-100 dark:bg-slate-700 font-medium text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
              ].join(' ')}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
              <span className="truncate flex-1 text-left">{list.name}</span>
              {list.memberCount > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  👥 {list.memberCount}
                </span>
              )}
            </button>

            {/* Bouton paramètres visible au hover */}
            <ListSettingsPanel
              list={list}
              onDeleted={() => {
                if (activeList?.id === list.id) onSelectList?.(null as unknown as TaskListSummary)
              }}
              onLeft={() => {
                if (activeList?.id === list.id) onSelectList?.(null as unknown as TaskListSummary)
              }}
            />
          </div>
        ))}
      </div>

      {/* Bas : thème + langue + profil */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2 shrink-0">

        {/* Thème */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {themes.map(th => (
            <button key={th} onClick={() => setTheme(th)}
              title={t(`settings.themes.${th}`)}
              aria-pressed={theme === th}
              className={[
                'flex-1 flex items-center justify-center p-1.5 rounded-md transition-all',
                theme === th
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
              ].join(' ')}>
              {THEME_ICONS[th]}
            </button>
          ))}
        </div>

        {/* Langue */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <Globe size={12} className="text-slate-400 self-center ml-1 shrink-0" />
          {langs.map(lang => (
            <button key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              aria-pressed={i18n.language.startsWith(lang.code)}
              className={[
                'flex-1 text-xs font-semibold py-1.5 rounded-md transition-all',
                i18n.language.startsWith(lang.code)
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
              ].join(' ')}>
              {lang.label}
            </button>
          ))}
        </div>

        {/* Profil + déconnexion */}
        <div className="flex items-center gap-2">
          <Link to="/profile" onClick={closeSidebar}
            className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-0">
            {user && <Avatar user={user} size="sm" />}
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{user?.name}</span>
          </Link>
          <button onClick={logout} title={t('nav.logout')}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSidebar} />
          <aside className="relative w-72 bg-white dark:bg-slate-800 h-full flex flex-col z-50 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Contenu principal */}
      {/* Modal création liste */}
      <CreateListModal
        isOpen={createListOpen}
        onClose={() => setCreateListOpen(false)}
        onSubmit={handleCreateList}
        isLoading={createList.isPending}
      />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {activeList && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeList.color }} />
            )}
            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {activeList?.name ?? t('app.name')}
            </span>
          </div>
          <NotificationBell />
          <Link to="/profile" onClick={closeSidebar}>
            {user && <Avatar user={user} size="sm" />}
          </Link>
        </header>

        {/* Topbar desktop */}
        <header className="hidden lg:flex justify-end items-center px-6 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div key={location.pathname} className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}