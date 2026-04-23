import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Settings,
  Trash2,
  Link,
  Copy,
  Check,
  Shield,
  UserMinus,
  Crown,
  X,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  useTaskList,
  useDeleteList,
  useLeaveList,
  useGenerateInvite,
  useRevokeInvite,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/useTaskList";
import { useAuth } from "@/context/AuthContext";
import { TaskListRole, TaskListSummary } from "@/types/taskList";

/**
 * @module components/tasks/ListSettingsPanel
 * @description Panneau de gestion d'une liste : membres, invitations, suppression, quitter.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

interface ListSettingsPanelProps {
  list: TaskListSummary;
  onDeleted?: () => void;
  onLeft?: () => void;
}

/**
 * @function ListSettingsPanel
 * @param {ListSettingsPanelProps} props
 * @returns {JSX.Element}
 */
export function ListSettingsPanel({
  list,
  onDeleted,
  onLeft,
}: ListSettingsPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteRole, setInviteRole] = useState<TaskListRole>(TaskListRole.READER);

  const { data: detail, isLoading } = useTaskList(open ? list.id : 0);

  const deleteList     = useDeleteList();
  const leaveList      = useLeaveList();
  const generateInvite = useGenerateInvite();
  const revokeInvite   = useRevokeInvite();
  const updateRole     = useUpdateMemberRole();
  const removeMember   = useRemoveMember();

  const isOwner  = list.owner.id === user?.id;
  const inviteUrl = detail?.inviteToken
    ? `${window.location.origin}/join/${detail.inviteToken}`
    : null;

  const handleDelete = async () => {
    if (!window.confirm(t("list.confirmDelete", { name: list.name }))) return;
    await deleteList.mutateAsync(list.id);
    toast.success(t("messages.listDeleted"));
    setOpen(false);
    onDeleted?.();
  };

  const handleLeave = async () => {
    if (!window.confirm(t("list.confirmLeave", { name: list.name }))) return;
    await leaveList.mutateAsync(list.id);
    toast.success(t("messages.listLeft"));
    setOpen(false);
    onLeft?.();
  };

  const handleGenerateInvite = async () => {
    await generateInvite.mutateAsync({ id: list.id, role: inviteRole });
    toast.success(t("messages.inviteLinkGenerated"));
  };

  const handleRevokeInvite = async () => {
    await revokeInvite.mutateAsync(list.id);
    toast.success(t("messages.inviteLinkRevoked"));
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("messages.linkCopied"));
  };

  const handleUpdateRole = async (memberId: number, role: TaskListRole) => {
    await updateRole.mutateAsync({ listId: list.id, memberId, role });
    toast.success(t("messages.roleUpdated"));
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!window.confirm(t("list.confirmRemoveMember", { name: memberName }))) return;
    await removeMember.mutateAsync({ listId: list.id, memberId });
    toast.success(t("messages.memberRemoved"));
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
        aria-label={t("settings.title")}
        title={t("settings.title")}
      >
        <Settings size={13} />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`${t("settings.title")} : ${list.name}`}
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Membres */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Shield size={14} /> {t("list.members")} ({(detail?.members?.length ?? 0) + 1})
              </h3>

              <div className="space-y-2">
                {/* Propriétaire */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div className="flex items-center gap-2.5">
                    <Avatar user={detail?.owner ?? list.owner} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {detail?.owner?.name ?? list.owner.name}
                        {user?.id === list.owner.id && (
                          <span className="ml-1 text-xs text-slate-400">{t("list.you")}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {detail?.owner?.email ?? list.owner.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Crown size={12} className="text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      {t("list.roles.owner")}
                    </span>
                  </div>
                </div>

                {/* Membres */}
                {detail?.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar user={member.user} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {member.user.name}
                          {user?.id === member.user.id && (
                            <span className="ml-1 text-xs text-slate-400">{t("list.you")}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value as TaskListRole)}
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <option value={TaskListRole.READER}>{t("list.roles.reader")}</option>
                            <option value={TaskListRole.EDITOR}>{t("list.roles.editor")}</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id, member.user.name)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded"
                            aria-label={`${t("actions.delete")} ${member.user.name}`}
                          >
                            <UserMinus size={13} />
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            member.role === TaskListRole.EDITOR
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {member.role === TaskListRole.EDITOR
                            ? t("list.roles.editor")
                            : t("list.roles.reader")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {(!detail?.members || detail.members.length === 0) && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic px-3 py-2">
                    {t("list.noMembers")}
                  </p>
                )}
              </div>
            </section>

            {/* Lien d'invitation (propriétaire uniquement) */}
            {isOwner && (
              <section className="border-t border-slate-200 dark:border-slate-700 pt-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Link size={14} /> {t("list.shareLink")}
                </h3>

                {inviteUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate font-mono">
                        {inviteUrl}
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleCopyLink} className="shrink-0">
                        {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copied ? t("messages.linkCopied") : t("actions.confirm")}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("list.defaultRole")}</span>
                      <span className="font-medium capitalize">{detail?.defaultInviteRole}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRevokeInvite}
                      isLoading={revokeInvite.isPending}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700"
                    >
                      <X size={13} /> {t("list.revokeLink")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("list.noMembers")}
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as TaskListRole)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <option value={TaskListRole.READER}>{t("list.inviteRole.reader")}</option>
                        <option value={TaskListRole.EDITOR}>{t("list.inviteRole.editor")}</option>
                      </select>
                      <Button size="sm" onClick={handleGenerateInvite} isLoading={generateInvite.isPending}>
                        <RefreshCw size={13} /> {t("list.generateLink")}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Zone dangereuse */}
            <section className="border-t border-slate-200 dark:border-slate-700 pt-5">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                {t("list.dangerZone")}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {isOwner ? (
                  <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteList.isPending}>
                    <Trash2 size={13} /> {t("list.delete")}
                  </Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={handleLeave} isLoading={leaveList.isPending}>
                    <X size={13} /> {t("list.leave")}
                  </Button>
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}
