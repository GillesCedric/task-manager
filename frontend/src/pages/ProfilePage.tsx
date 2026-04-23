import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Camera, Save, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import axiosInstance from "@/api/axiosInstance";
import type { User } from "@/types/auth";

/**
 * @module pages/ProfilePage
 * @description Page de profil — modification du nom, bio, avatar et mot de passe.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

/**
 * @function ProfilePage
 * @returns {JSX.Element}
 */
export function ProfilePage() {
  const { t } = useTranslation();
  const { user, login, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      name: user?.name ?? "",
      bio: (user as User & { bio?: string })?.bio ?? "",
    },
  });
  const pwdForm = useForm({
    defaultValues: { current_password: "", new_password: "" },
  });

  const handleProfileSave = async (data: { name: string; bio: string }) => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch<{ success: boolean; user: User }>(
        "/profile",
        data,
      );
      if (token) login(token, res.data.user);
      toast.success(t("messages.profileUpdated"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      toast.error(t("messages.avatarTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await axiosInstance.post<{ success: boolean; user: User }>(
          "/profile/avatar",
          { avatar: base64 },
        );
        if (token) login(token, res.data.user);
        toast.success(t("messages.avatarUpdated"));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e: unknown) {
      toast.error((e as Error).message);
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await axiosInstance.post<{ success: boolean; user: User }>(
        "/profile/avatar",
        { avatar: null },
      );
      if (token) login(token, res.data.user);
      toast.success(t("messages.avatarRemoved"));
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handlePasswordChange = async (data: {
    current_password: string;
    new_password: string;
  }) => {
    setSavingPwd(true);
    try {
      await axiosInstance.post("/profile/password", data);
      toast.success(t("messages.passwordUpdated"));
      pwdForm.reset();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSavingPwd(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t("profile.title")}
      </h1>

      {/* Avatar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
          {t("profile.avatar")}
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar user={user} size="lg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
              aria-label={t("profile.avatar")}
            >
              {uploading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={13} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {user.name}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {user.email}
            </p>
            {user.avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                {t("profile.removeAvatar")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
          {t("profile.info")}
        </h2>
        <form
          onSubmit={profileForm.handleSubmit(handleProfileSave)}
          className="space-y-4"
        >
          <Input
            id="name"
            label={t("auth.name")}
            required
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register("name", {
              required: t("validation.required"),
              minLength: { value: 2, message: t("validation.min2chars") },
            })}
          />
          <Textarea
            id="bio"
            label={t("profile.bioOptional")}
            rows={2}
            placeholder={t("profile.bioPlaceholder")}
            {...profileForm.register("bio")}
          />
          <Button type="submit" isLoading={saving}>
            <Save size={14} /> {t("actions.save")}
          </Button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
          {t("profile.changePassword")}
        </h2>
        <form
          onSubmit={pwdForm.handleSubmit(handlePasswordChange)}
          className="space-y-4"
        >
          <Input
            id="current_password"
            type="password"
            label={t("profile.currentPassword")}
            required
            {...pwdForm.register("current_password", { required: t("validation.required") })}
          />
          <Input
            id="new_password"
            type="password"
            label={t("profile.newPassword")}
            required
            placeholder={t("auth.passwordHint")}
            {...pwdForm.register("new_password", {
              required: t("validation.required"),
              minLength: { value: 8, message: t("validation.min8chars") },
            })}
          />
          <Button type="submit" variant="secondary" isLoading={savingPwd}>
            <Lock size={14} /> {t("profile.updatePassword")}
          </Button>
        </form>
      </div>
    </div>
  );
}
