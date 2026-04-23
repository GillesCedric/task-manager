import axiosInstance from "./axiosInstance";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "@/types/auth";

/**
 * @module api/authApi
 * @description Appels HTTP liés à l'authentification — login, register, profil.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */
export const authApi = {
  /**
   * @function login
   * @description Authentifie un utilisateur et retourne un token JWT.
   *
   * @param {LoginPayload} payload Email et mot de passe
   * @returns {Promise<AuthResponse>}
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  /**
   * @function register
   * @description Inscrit un nouvel utilisateur et retourne un token JWT.
   *
   * @param {RegisterPayload} payload Nom, email et mot de passe
   * @returns {Promise<AuthResponse>}
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    console.log("Register payload:", payload); // Debug log pour vérifier les données envoyées
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  /**
   * @function me
   * @description Récupère le profil de l'utilisateur authentifié.
   *
   * @returns {Promise<User>}
   */
  me: async (): Promise<User> => {
    const { data } = await axiosInstance.get<{ success: boolean; user: User }>(
      "/auth/me",
    );
    return data.user;
  },
} as const;
