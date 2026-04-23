import { useMutation } from '@tanstack/react-query'
import { useNavigate }  from 'react-router-dom'
import toast            from 'react-hot-toast'
import { authApi }      from '@/api/authApi'
import { useAuth }      from '@/context/AuthContext'
import type { LoginPayload, RegisterPayload } from '@/types/auth'

/**
 * @module hooks/useAuth
 * @description Mutations React Query pour l'authentification avec gestion des toasts.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @function useLogin
 * @description Mutation de connexion — persiste le token et redirige vers le dashboard.
 *
 * @returns {UseMutationResult}
 */
export function useLogin() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess:  (data) => {
      login(data.token, data.user)
      navigate('/dashboard')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

/**
 * @function useRegister
 * @description Mutation d'inscription — connecte directement et redirige vers le dashboard.
 *
 * @returns {UseMutationResult}
 */
export function useRegister() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess:  (data) => {
      login(data.token, data.user)
      toast.success('Bienvenue !')
      navigate('/dashboard')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
