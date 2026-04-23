/**
 * @module types/taskList
 * @description Types TypeScript pour les listes de tâches et leurs membres.
 *
 * L'API expose deux niveaux de détail selon le groupe de sérialisation Symfony :
 * - **`list:read`**   → `TaskListSummary` — données légères sans membres, utilisé dans la sidebar
 * - **`list:detail`** → `TaskList`        — données complètes avec membres et token d'invitation
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

/**
 * Rôles possibles d'un membre dans une liste.
 * Correspond à l'enum PHP `TaskListRole`.
 */
export enum TaskListRole {
  /** Peut créer, modifier et supprimer des tâches dans la liste */
  EDITOR = 'EDITOR',
  /** Lecture seule — ne peut pas modifier les tâches */
  READER = 'READER',
}

/**
 * Informations minimales d'un utilisateur dans le contexte d'une liste.
 * Dénormalisées pour éviter les jointures dans les vues légères.
 */
export interface ListUser {
  id:        number
  name:      string
  email:     string
  avatarUrl: string | null
}

/**
 * Membre d'une liste avec son rôle et sa date d'adhésion.
 */
export interface TaskListMember {
  id:       number
  user:     ListUser
  role:     TaskListRole
  joinedAt: string
}

/**
 * Vue légère d'une liste de tâches — groupe `list:read`.
 * Pas de membres individuels, uniquement le compteur pour affichage dans la sidebar.
 * Utilisé dans tous les composants qui n'ont pas besoin du détail complet.
 */
export interface TaskListSummary {
  id:          number
  name:        string
  /** Couleur hex de la liste, ex: "#3b82f6" */
  color:       string
  description: string | null
  owner:       ListUser
  /** Nombre de membres hors propriétaire */
  memberCount: number
  createdAt:   string
  updatedAt:   string
}

/**
 * Vue complète d'une liste de tâches — groupe `list:detail`.
 * Inclut la liste des membres et le token d'invitation.
 * Chargé uniquement à l'ouverture du panneau de gestion de liste.
 *
 * @remarks
 * `inviteToken` n'est exposé qu'au propriétaire côté serveur.
 * Les membres ne reçoivent jamais ce champ.
 */
export interface TaskList extends TaskListSummary {
  members:           TaskListMember[]
  /** Token opaque pour le lien d'invitation — null si aucun lien actif */
  inviteToken:       string | null
  defaultInviteRole: TaskListRole
}

/** Payload pour `POST /api/lists` */
export interface CreateListPayload {
  name:        string
  /** Couleur hex de la liste — défaut: "#3b82f6" */
  color:       string
  description?: string
}

/** Payload pour `PATCH /api/lists/:id` — tous les champs sont optionnels */
export interface UpdateListPayload {
  name?:        string
  color?:       string
  description?: string
}
