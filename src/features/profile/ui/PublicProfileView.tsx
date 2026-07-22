"use client";

import Image from "next/image";
import { useState } from "react";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createDirectChat } from "@/entities/chat";
import type { PublicUserProfile, UserRole } from "@/entities/user";
import { UserIdentityCard, type UserIdentitySocial } from "@/shared/ui/UserIdentityCard";
import { PROFILE_SOCIALS } from "../model/socialLinks";
import { ReportUserButton } from "./ReportUserButton";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  moderator: "Moderator",
  administrator: "Administrator",
};

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Not specified";
  return String(value);
}

function formatMemberSince(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function userInitials(profile: PublicUserProfile) {
  const initials = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "U";
}

function ProfileValue({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold text-(--color-text-secondary)">{label}</dt>
      <dd className="break-words text-base font-semibold text-(--color-text-primary) [overflow-wrap:anywhere]">
        {displayValue(value)}
      </dd>
    </div>
  );
}

function ProfileText({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-(--color-text-primary)">{label}</h2>
      <p className="mt-2 break-words whitespace-pre-wrap text-base leading-7 text-(--color-text-secondary) [overflow-wrap:anywhere]">
        {displayValue(value)}
      </p>
    </div>
  );
}

function RoleSpecificDetails({ profile }: { profile: PublicUserProfile }) {
  if (!profile.profile) {
    if (profile.role === "administrator") return null;
    return (
      <p className="rounded-xl bg-(--color-white-50) p-5 text-(--color-text-secondary)">
        This user has not added public profile details yet.
      </p>
    );
  }

  if (profile.role === "teacher") {
    const rating = Number(profile.profile.rating);
    return (
      <div className="space-y-7">
        <dl className="grid gap-5 sm:grid-cols-2">
          <ProfileValue label="Specialization" value={profile.profile.specialization} />
          <ProfileValue label="Professional experience" value={profile.profile.experience} />
        </dl>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-(--color-white-50) p-4 shadow-(--shadow-usp-glass)">
            <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-secondary)">
              <Star
                aria-hidden="true"
                className="h-4 w-4 fill-(--color-gold) text-(--color-gold)"
              />
              Rating
            </div>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">
              {rating > 0 ? rating.toFixed(1) : "Not rated"}
            </p>
          </div>
          <div className="rounded-xl bg-(--color-white-50) p-4 shadow-(--shadow-usp-glass)">
            <p className="text-sm font-semibold text-(--color-text-secondary)">
              Years of experience
            </p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">
              {displayValue(profile.profile.years_experience)}
            </p>
          </div>
          <div className="rounded-xl bg-(--color-white-50) p-4 shadow-(--shadow-usp-glass)">
            <p className="text-sm font-semibold text-(--color-text-secondary)">Partnerships</p>
            <p className="mt-2 text-2xl font-bold text-(--color-text-primary)">
              {displayValue(profile.profile.partnerships_count)}
            </p>
          </div>
        </div>

        <ProfileText label="About" value={profile.profile.bio} />
      </div>
    );
  }

  if (profile.role === "student") {
    return (
      <div className="space-y-7">
        <dl className="grid gap-5 sm:grid-cols-2">
          <ProfileValue label="Education level" value={profile.profile.education_level} />
        </dl>
        <ProfileText label="Learning goals" value={profile.profile.learning_goals} />
      </div>
    );
  }

  if (profile.role === "moderator") {
    return (
      <dl className="grid gap-5 sm:grid-cols-2">
        <ProfileValue label="Moderator level" value={profile.profile.level} />
      </dl>
    );
  }

  return null;
}

type Props = {
  profile: PublicUserProfile;
  compact?: boolean;
  onClose?: () => void;
  dismissBeforeNavigation?: boolean;
};

/** Read-only public profile styled after the current user's home profile. */
export function PublicProfileView({
  profile,
  compact = false,
  onClose,
  dismissBeforeNavigation = false,
}: Props) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState("");
  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || `User #${profile.id}`;
  const socialLinks = PROFILE_SOCIALS.filter((social) => Boolean(profile[social.key]));

  async function sendMessage() {
    setMessaging(true);
    setMessageError("");
    try {
      const chat = await createDirectChat(profile.id);
      if (dismissBeforeNavigation) onClose?.();
      router.push(`/student-dashboard/chats?chat=${chat.id}`);
    } catch {
      setMessageError("The conversation could not be opened. Try again.");
      setMessaging(false);
    }
  }

  if (compact && !profile.is_self && (profile.role === "student" || profile.role === "teacher")) {
    const compactSocials: UserIdentitySocial[] = socialLinks.map((social) => ({
      key: social.key,
      label: social.label,
      href: profile[social.key],
      iconSrc: social.srcGray,
    }));

    return (
      <div>
        <UserIdentityCard
          name={fullName}
          avatar={profile.avatar}
          socials={compactSocials}
          onMessage={() => void sendMessage()}
          messaging={messaging}
          messageLabel={messageError ? "Try again" : "Send message"}
          topLeftAction={
            onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                className="flex h-7 w-7 items-center justify-center rounded-full text-(--color-text-primary) transition hover:bg-(--color-bg-surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue)"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            ) : null
          }
          topRightAction={
            <ReportUserButton
              userId={profile.id}
              userName={fullName}
              initiallyReported={profile.has_reported}
              variant="corner"
            />
          }
        />
        {messageError ? (
          <p className="sr-only" role="alert">
            {messageError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section className="relative isolate min-h-full overflow-hidden px-(--page-padding-x) py-(--page-padding-y) font-(family-name:--font-base)">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <span className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-(--color-brand-lavender) opacity-45 blur-3xl" />
        <span className="absolute right-1/4 top-0 h-72 w-72 rounded-full bg-(--color-brand-pink) opacity-40 blur-3xl" />
        <span className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-(--color-brand-cream) opacity-70 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-(--color-white-60) bg-(--color-white-60) shadow-(--shadow-card) backdrop-blur-xl lg:grid-cols-[minmax(16rem,0.8fr)_0.25rem_minmax(0,1.7fr)]">
        <aside className="flex flex-col items-center px-6 py-8 text-center sm:px-8 lg:py-12">
          <div className="relative h-40 w-40 overflow-hidden rounded-full bg-(--color-surface) shadow-(--shadow-card) sm:h-48 sm:w-48">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={fullName}
                fill
                unoptimized
                sizes="(min-width: 640px) 192px, 160px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[image:var(--gradient-brand)] text-5xl font-bold text-(--color-text-primary)">
                {userInitials(profile)}
              </div>
            )}
          </div>

          <h1 className="mt-6 max-w-full break-words text-2xl font-bold leading-tight text-(--color-text-primary) [overflow-wrap:anywhere] sm:text-3xl">
            {fullName}
          </h1>
          <span className="mt-3 rounded-full bg-(--color-badge-lavender) px-4 py-1.5 text-sm font-semibold text-(--color-blue-dark)">
            {ROLE_LABELS[profile.role]}
          </span>

          {socialLinks.length > 0 ? (
            <div className="mt-7">
              <p className="text-sm font-semibold text-(--color-text-secondary)">Social media</p>
              <div className="mt-3 flex justify-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={profile[social.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${fullName}'s ${social.label}`}
                    className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-blue)"
                  >
                    <Image
                      src={social.srcBlack}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {!profile.is_self && profile.role !== "administrator" ? (
            <div className="mt-8">
              <ReportUserButton
                userId={profile.id}
                userName={fullName}
                initiallyReported={profile.has_reported}
              />
            </div>
          ) : null}
        </aside>

        <div
          aria-hidden="true"
          className="hidden min-h-full bg-[image:var(--gradient-profile-line)] lg:block"
        />

        <div className="border-t border-(--color-border-light) px-6 py-8 sm:px-10 lg:border-l-0 lg:border-t-0 lg:px-12 lg:py-12">
          <div>
            <p className="font-(family-name:--font-accent) text-sm font-semibold uppercase tracking-wider text-(--color-blue)">
              Public profile
            </p>
            <h2 className="mt-2 text-3xl font-bold text-(--color-text-primary)">About the user</h2>
          </div>

          <dl className="mt-8 grid gap-5 border-b border-(--color-border-light) pb-7 sm:grid-cols-2">
            <ProfileValue label="Role" value={ROLE_LABELS[profile.role]} />
            <ProfileValue label="Member since" value={formatMemberSince(profile.date_joined)} />
            {profile.role === "administrator" && profile.email ? (
              <ProfileValue label="Email" value={profile.email} />
            ) : null}
          </dl>

          <div className="mt-7">
            <RoleSpecificDetails profile={profile} />
          </div>
        </div>
      </div>
    </section>
  );
}
