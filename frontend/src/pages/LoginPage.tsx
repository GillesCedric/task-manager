import { useForm }         from 'react-hook-form'
import { zodResolver }     from '@hookform/resolvers/zod'
import { Link }            from 'react-router-dom'
import { useTranslation }  from 'react-i18next'
import { loginSchema, type LoginFormData } from '@/schemas/authSchemas'
import { useLogin }        from '@/hooks/useAuth'
import { Button }          from '@/components/ui/Button'
import { Input }           from '@/components/ui/Input'

/**
 * @module pages/LoginPage
 * @description Page de connexion avec formulaire React Hook Form + Zod.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @function LoginPage
 * @description Page de connexion — email + mot de passe → token JWT.
 *
 * @returns {JSX.Element}
 */
export function LoginPage() {
  const { t }  = useTranslation()
  const login  = useLogin()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">TM</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.login')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('app.tagline')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <form onSubmit={handleSubmit(d => login.mutate(d))} noValidate className="space-y-4">
            <Input id="email" type="email" label={t('auth.email')} required autoComplete="email"
              error={errors.email?.message} {...register('email')} />
            <Input id="password" type="password" label={t('auth.password')} required autoComplete="current-password"
              error={errors.password?.message} {...register('password')} />
            <Button type="submit" fullWidth isLoading={login.isPending}>
              {t('auth.loginButton')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
