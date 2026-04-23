/**
 * @module api/axiosInstance
 * @description Instance Axios centralisée — configuration, intercepteurs d'authentification et de gestion d'erreurs.
 *
 * **Intercepteur de requête :**
 * Injecte automatiquement le token JWT depuis `localStorage` dans le header
 * `Authorization: Bearer <token>` sur chaque requête sortante.
 * Aucune configuration manuelle nécessaire dans les composants appelants.
 *
 * **Intercepteur de réponse :**
 * - Normalise toutes les erreurs en instances `Error` standard avec un message lisible.
 * - Sur HTTP 401 : efface le token expiré et redirige vers `/login` (hard redirect).
 * - Source du message d'erreur (par ordre de priorité) :
 *   1. `response.data.error` (message API structuré)
 *   2. `error.message` (message Axios : réseau, timeout…)
 *   3. Message générique de fallback
 *
 * **Sécurité :**
 * Le token JWT est stocké dans `localStorage` pour la simplicité de cette démo.
 * En production avec des exigences de sécurité strictes, préférer un cookie `HttpOnly`
 * pour éviter l'exposition aux scripts XSS (arbitrage documenté).
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

import axios, { type AxiosError, type AxiosResponse } from 'axios'
import type { ApiErrorResponse } from '@/types/task'

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? '') + '/api',
  timeout:         10_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
  withCredentials: false,
})

// ─── Intercepteur de requête — injection du Bearer token ──────────────────────

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Intercepteur de réponse — normalisation des erreurs ──────────────────────

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Token expiré ou invalide — déconnexion propre et redirection
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }

    const message =
      error.response?.data?.error ??
      error.message               ??
      'Une erreur inattendue est survenue.'

    return Promise.reject(new Error(message))
  },
)

export default axiosInstance
