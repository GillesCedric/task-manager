/**
 * @module types/notification
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 */

/** @enum NotificationType — Types de notifications */
export enum NotificationType {
	INVITE = "INVITE",
	TASK_ASSIGNED = "TASK_ASSIGNED",
	TASK_UPDATED = "TASK_UPDATED",
	MEMBER_JOINED = "MEMBER_JOINED",
	MEMBER_LEFT = "MEMBER_LEFT"
}

export interface Notification {
  id:        number
  type:      NotificationType
  payload:   Record<string, unknown>
  isRead:    boolean
  createdAt: string
  actor:     { id: number; name: string; avatarUrl: string | null } | null
}

export interface NotificationResponse {
  success:      boolean
  data:         Notification[]
  unread_count: number
}