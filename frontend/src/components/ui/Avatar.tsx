import type { User } from "@/types/auth";

/**
 * @module components/ui/Avatar
 * @description Avatar utilisateur — photo si disponible, initiales sinon.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.1.0
 */

interface AvatarProps {
  user: Pick<User, "name" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-16 h-16 text-xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function stringToColor(str: string): string {
  const COLORS = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * @function Avatar
 * @param {AvatarProps} props
 * @returns {JSX.Element}
 */
export function Avatar({ user, size = "md" }: AvatarProps) {
  const sizeClass = SIZES[size];

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${stringToColor(user.name)} rounded-full flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white dark:ring-slate-700`}
    >
      {getInitials(user.name)}
    </div>
  );
}
