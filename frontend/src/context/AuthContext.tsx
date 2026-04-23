import {
  createContext, useCallback, useContext,
  useState, type ReactNode,
} from 'react'
import type { User } from '@/types/auth'

/**
 * @module context/AuthContext
 * @description Gestion de l'état d'authentification JWT — token + profil utilisateur.
 *
 * Le token est stocké dans localStorage (simple pour une démo).
 * En production, on préfèrerait un cookie HttpOnly pour éviter
 * l'exposition du token aux scripts XSS — arbitrage conscient ici.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

const TOKEN_KEY = 'auth_token'
const USER_KEY  = 'auth_user'

interface AuthContextValue {
  user:    User | null
  token:   string | null
  isAuth:  boolean
  isAdmin: boolean
  login:   (token: string, user: User) => void
  logout:  () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * @function AuthProvider
 * @description Provider du contexte d'authentification.
 *
 * @param {{ children: ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user,  setUser]  = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  })

  /**
   * @function login
   * @description Persiste le token et le profil après authentification réussie.
   *
   * @param {string} token  Le JWT retourné par l'API
   * @param {User}   user   Le profil de l'utilisateur authentifié
   */
  const login = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  /**
   * @function logout
   * @description Efface les données d'authentification et redirige vers la page de connexion.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuth: !!token, isAdmin: user?.roles?.includes('ROLE_ADMIN') ?? false, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * @function useAuth
 * @description Hook d'accès au contexte d'authentification.
 * @returns {AuthContextValue}
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthContext }
