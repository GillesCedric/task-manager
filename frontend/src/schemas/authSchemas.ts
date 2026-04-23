import { z } from 'zod'

/**
 * @module schemas/authSchemas
 * @description Schémas Zod pour les formulaires d'authentification.
 * Les règles de mot de passe sont synchronisées avec les contraintes PHP RegisterDTO.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */

/**
 * @constant loginSchema
 * @description Validation du formulaire de connexion.
 */
export const loginSchema = z.object({
  email:    z.string().email('Email invalide.').min(1, 'Email obligatoire.'),
  password: z.string().min(1, 'Mot de passe obligatoire.'),
})

/**
 * @constant registerSchema
 * @description Validation du formulaire d'inscription avec règles de complexité de mot de passe.
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2,  'Le nom doit contenir au moins 2 caractères.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.')
    .transform(v => v.trim()),

  email: z
    .string()
    .email('Adresse email invalide.')
    .max(180),

  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .regex(/[A-Z]/,   'Le mot de passe doit contenir au moins une majuscule.')
    .regex(/[0-9]/,   'Le mot de passe doit contenir au moins un chiffre.'),
})

export type LoginFormData    = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
