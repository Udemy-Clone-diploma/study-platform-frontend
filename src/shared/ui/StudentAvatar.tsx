function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Round student avatar photo, falling back to a gradient circle with initials when no avatar is set. */
export function StudentAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  const size = "clamp(32px, 2.78vw, 40px)";
  if (avatar)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: "var(--gradient-brand)" }}
    >
      <span
        style={{
          fontFamily: "var(--font-accent)",
          fontWeight: 700,
          fontSize: "clamp(9px, 0.69vw, 11px)",
          color: "var(--color-text-primary)",
          lineHeight: 1,
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}
