/**
 * @module types/auth
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

export interface User {
  id:        number
  name:      string
  email:     string
  roles:     string[]
  avatarUrl: string | null
  bio?:      string | null
  createdAt: string
}

export interface AuthState {
  user:  User | null
  token: string | null
}

export interface LoginPayload {
  email:    string
  password: string
}

export interface RegisterPayload {
  name:     string
  email:    string
  password: string
}

export interface AuthResponse {
  success: boolean
  token:   string
  user:    User
}