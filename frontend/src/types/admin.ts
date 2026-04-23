/**
 * @module types/admin
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export interface AdminStats {
  users: { total: number; admins: number; new_last_7_days: number }
  tasks: { total: number; todo: number; in_progress: number; done: number; urgent: number; high: number; overdue: number; new_last_7_days: number }
  lists: { total: number; shared: number; new_last_7_days: number }
  logs:  Record<string, number>
}

export interface AppLog {
  id:        number
  level:     'debug' | 'info' | 'warning' | 'error' | 'security'
  message:   string
  context:   Record<string, unknown>
  channel:   string | null
  createdAt: string
}

export interface AdminPagination {
  total:       number
  page:        number
  per_page:    number
  total_pages: number
}
