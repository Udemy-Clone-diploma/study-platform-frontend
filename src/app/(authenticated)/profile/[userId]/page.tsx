import { notFound } from "next/navigation";
import type { UserRole } from "@/entities/user";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";

type ProfileSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function roleLabel(role?: string): string {
  const labels: Record<UserRole, string> = {
    student: "Student",
    teacher: "Teacher",
    moderator: "Moderator",
    administrator: "Administrator",
  };

  return role && role in labels ? labels[role as UserRole] : "Not specified";
}

function userInitials(name: string, email?: string) {
  const source = name.trim() || email?.trim() || "User";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function ChatUserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<ProfileSearchParams>;
}) {
  const { userId } = await params;
  const query = await searchParams;
  const numericUserId = Number(userId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    notFound();
  }

  const name = firstParam(query.name)?.trim() || `User #${numericUserId}`;
  const email = firstParam(query.email)?.trim();
  const role = firstParam(query.role)?.trim();
  const avatar = resolveMediaUrl(firstParam(query.avatar));
  const details = [
    { label: "Name", value: name },
    { label: "Email", value: email || "Not provided" },
    { label: "Role", value: roleLabel(role) },
    { label: "User ID", value: String(numericUserId) },
  ];

  return (
    <section className="min-h-full bg-[#D6E0FF] px-[clamp(32px,5vw,92px)] py-[clamp(28px,4vw,56px)] text-[#121212]">
      <div className="mx-auto max-w-[900px]">
        <div className="rounded-[18px] border border-white/70 bg-white/55 p-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]">
          <div className="flex items-start gap-6">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="h-28 w-28 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#A7BAFA] text-3xl font-bold text-[#0B257C]">
                {userInitials(name, email)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#003AFF]">
                Profile preview
              </p>
              <h1 className="mt-2 truncate text-3xl font-bold">{name}</h1>
              <p className="mt-2 text-sm text-[#4B5563]">
                Basic information from the chat. The full profile will be implemented later.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="rounded-lg bg-white px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-base font-semibold text-[#121212]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
