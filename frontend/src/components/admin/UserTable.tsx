import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ShieldOff, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from '@/hooks/useAdmin'
import { useAuth } from '@/context/AuthContext'

/**
 * @module components/admin/UserTable
 * @description Table de gestion des utilisateurs — rôles, suppression.
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export function UserTable() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data, isLoading } = useAdminUsers(page, debouncedSearch || undefined)
  const updateUser = useUpdateAdminUser()
  const deleteUser = useDeleteAdminUser()

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout((window as unknown as { _st?: ReturnType<typeof setTimeout> })._st)
    ;(window as unknown as { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedSearch(v); setPage(1)
    }, 350)
  }

  const toggleAdmin = async (id: number, isAdmin: boolean) => {
    const roles = isAdmin ? [] : ['ROLE_ADMIN']
    await updateUser.mutateAsync({ id, payload: { roles } })
    toast.success(isAdmin ? t('admin.roleRemoved') : t('admin.roleGranted'))
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(t('admin.confirmDeleteUser', { name }))) return
    await deleteUser.mutateAsync(id)
    toast.success(t('messages.memberRemoved'))
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder={t('actions.search')}
          className="pl-9 pr-3 py-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('admin.user')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">{t('auth.email')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('admin.role')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">{t('task.createdAt')}</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td></tr>
                ))
              : data?.data.map((u, i) => {
                  const isAdmin = u.roles.includes('ROLE_ADMIN')
                  const isMe    = u.id === me?.id
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors animate-fade-in-up animation-delay-${Math.min(i + 1, 8)}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={u} size="sm" />
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-32">{u.name}</span>
                          {isMe && <span className="text-xs text-slate-400">{t('list.you')}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell truncate max-w-48">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!isMe && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleAdmin(u.id, isAdmin)}
                              title={isAdmin ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isAdmin
                                  ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                                  : 'text-slate-400 hover:text-purple-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {isAdmin ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              title={t('actions.delete')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {t('pagination.showing', {
              from: (page - 1) * 20 + 1,
              to:   Math.min(page * 20, data.pagination.total),
              total: data.pagination.total,
            })}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.total_pages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
