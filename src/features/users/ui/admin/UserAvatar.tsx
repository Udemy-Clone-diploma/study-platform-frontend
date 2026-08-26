import type { UserData } from "@/entities/user";

type Props = {
  user: Pick<UserData, "first_name" | "last_name" | "avatar">;
  size?: string;
};

export function UserAvatar({ user, size = "clamp(36px, 2.78vw, 44px)" }: Props) {
  const name = `${user.first_name} ${user.last_name}`.trim();

  if (user.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = [user.first_name[0], user.last_name[0]].filter(Boolean).join("").toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: "var(--gradient-brand)" }}
    >
      <span
        className="font-(family-name:--font-accent) font-bold text-(--color-text-primary)"
        style={{ fontSize: "clamp(10px, 0.76vw, 12px)", lineHeight: 1 }}
      >
        {initials}
      </span>
    </div>
  );
}
