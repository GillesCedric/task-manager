import { Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useMutation, useQueryClient }  from '@tanstack/react-query'
import { Toaster }             from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider }       from '@/context/ThemeContext'
import { Layout }              from '@/components/layout/Layout'
import { LoginPage }           from '@/pages/LoginPage'
import { RegisterPage }        from '@/pages/RegisterPage'
import { DashboardPage }       from '@/pages/DashboardPage'
import { ProfilePage }         from '@/pages/ProfilePage'
import { AdminPage }           from '@/pages/AdminPage'
import { taskListApi }         from '@/api/taskListApi'
import { LIST_KEYS }           from '@/hooks/useTaskList'
import type { TaskListSummary } from '@/types/taskList'

/**
 * @module App
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuth()
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuth()
  return isAuth ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

/**
 * @function JoinListPage
 * @description Page de jointure via token — redirige vers dashboard après.
 */
function JoinListPage({ onSelectList }: { onSelectList: (l: TaskListSummary) => void }) {
  const { token }  = useParams<{ token: string }>()
  const navigate   = useNavigate()
  const qc         = useQueryClient()

  const join = useMutation({
    mutationFn: (t: string) => taskListApi.joinByToken(t),
    onSuccess:  (list) => {
      qc.invalidateQueries({ queryKey: LIST_KEYS.all })
      onSelectList(list)
      navigate('/dashboard', { replace: true })
    },
    onError: () => navigate('/dashboard', { replace: true }),
  })

  useEffect(() => {
    if (token) join.mutate(token)
    else navigate('/dashboard', { replace: true })
  }, [token]) // eslint-disable-line

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Rejoindre la liste…</p>
      </div>
    </div>
  )
}

/**
 * @function AppRouter
 * @description Router principal avec état de la liste active partagé.
 */
function AppRouter() {
  const [activeList, setActiveList] = useState<TaskListSummary | null>(null)

  const handleSelectList = (list: TaskListSummary | null) => {
    setActiveList(list)
  }

  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/join/:token" element={
        <ProtectedRoute>
          <JoinListPage onSelectList={handleSelectList} />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout activeList={activeList} onSelectList={handleSelectList}>
            <DashboardPage activeList={activeList} onSelectList={handleSelectList} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout activeList={activeList} onSelectList={handleSelectList}>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute>
          <Layout activeList={activeList} onSelectList={handleSelectList}>
            <AdminPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px' } }}
            />
            <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-900" />}>
              <AppRouter />
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}