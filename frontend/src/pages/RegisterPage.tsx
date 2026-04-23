import { useForm }         from 'react-hook-form'
import { zodResolver }     from '@hookform/resolvers/zod'
import { Link }            from 'react-router-dom'
import { useTranslation }  from 'react-i18next'
import { registerSchema, type RegisterFormData } from '@/schemas/authSchemas'
import { useRegister }     from '@/hooks/useAuth'
import { Button }          from '@/components/ui/Button'
import { Input }           from '@/components/ui/Input'

/**
 * @module pages/RegisterPage
 * @description Page d'inscription avec validation de complexité de mot de passe.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @function RegisterPage
 * @description Formulaire d'inscription — après succès, l'utilisateur est connecté directement.
 *
 * @returns {JSX.Element}
 */
export function RegisterPage() {
  const { t }    = useTranslation()
  const register_ = useRegister()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">TM</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.register')}</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <form onSubmit={handleSubmit(d => register_.mutate(d))} noValidate className="space-y-4">
            <Input id="name" type="text" label={t('auth.name')} required autoComplete="name"
              error={errors.name?.message} {...register('name')} />
            <Input id="email" type="email" label={t('auth.email')} required autoComplete="email"
              error={errors.email?.message} {...register('email')} />
            <div>
              <Input id="password" type="password" label={t('auth.password')} required autoComplete="new-password"
                error={errors.password?.message} {...register('password')} />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('auth.passwordHint')}</p>
            </div>
            <Button type="submit" fullWidth isLoading={register_.isPending}>
              {t('auth.registerButton')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
