"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { TeacherApplication } from "@/entities/teacher-application";
import { formatUserDate } from "@/features/users";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

const SOCIAL_LABELS = [
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["behance", "Behance"],
] as const;

type Props = {
  application: TeacherApplication;
  onClose: () => void;
  onApprove: () => void;
  onCancelApplication: () => void;
};

/** Side panel shown next to the teacher applications table — a contact-data block, a teacher-info block, and the approve/cancel actions. */
export function TeacherApplicationDetailPanel({
  application,
  onClose,
  onApprove,
  onCancelApplication,
}: Props) {
  const t = useTranslations("TeacherApplicationsAdmin");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const socials = SOCIAL_LABELS.filter(([key]) => Boolean(application[key]));
  const name = `${application.first_name} ${application.last_name}`.trim() || application.email;

  return (
    <aside
      aria-label={t("applicationDetailsAriaLabel")}
      className="flex shrink-0 flex-col rounded-[20px] border border-white bg-(--color-white-20) shadow-(--shadow-usp-glass) backdrop-blur-md"
      style={{
        width: "clamp(320px, 26vw, 400px)",
        padding: "clamp(16px, 1.67vw, 24px)",
        gap: "clamp(14px, 1.25vw, 18px)",
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="overflow-hidden font-bold text-ellipsis whitespace-nowrap text-(--color-text-primary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(16px, 1.25vw, 18px)", margin: 0 }}
        >
          {name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeDetailsAriaLabel")}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-(--color-text-secondary) transition hover:bg-(--color-brand-lavender-soft)"
        >
          <X size={18} />
        </button>
      </div>

      <ApplicationStatusBadge status={application.status} />

      <PanelSection title={t("contactData")}>
        <DetailRow label={t("email")}>{application.email}</DetailRow>
        <DetailRow label={t("phone")}>{application.phone_number || "—"}</DetailRow>
        <DetailRow label={t("dateOfBirth")}>
          {application.date_of_birth ? formatUserDate(application.date_of_birth, locale) : "—"}
        </DetailRow>
      </PanelSection>

      <PanelSection title={t("teacherInformation")}>
        <DetailRow label={t("fieldOfStudy")}>{application.specialization || "—"}</DetailRow>
        <DetailRow label={t("yearsExp")}>
          {application.years_experience != null ? String(application.years_experience) : "—"}
        </DetailRow>
        <DetailRow label={t("directions")}>
          {application.directions.map((d) => d.name).join(", ") || "—"}
        </DetailRow>
        <DetailTextRow label={t("experience")}>{application.experience || "—"}</DetailTextRow>
        <DetailTextRow label={t("bio")}>{application.bio || "—"}</DetailTextRow>
        <DetailTextRow label={t("motivation")}>{application.motivation || "—"}</DetailTextRow>
        {socials.map(([key, label]) => (
          <DetailRow key={key} label={label}>
            <a
              href={application[key]}
              target="_blank"
              rel="noreferrer"
              className="text-(--color-blue) underline"
            >
              {application[key]}
            </a>
          </DetailRow>
        ))}
      </PanelSection>

      <PanelSection title={t("submission")}>
        <DetailRow label={t("submitted")}>{formatUserDate(application.submitted_at, locale)}</DetailRow>
        {application.decided_at && (
          <DetailRow label={t("decided")}>
            {formatUserDate(application.decided_at, locale)}
          </DetailRow>
        )}
        {application.moderator_name && (
          <DetailRow label={t("moderator")}>{application.moderator_name}</DetailRow>
        )}
        {application.moderator_comment && (
          <DetailTextRow label={t("moderatorComment")}>{application.moderator_comment}</DetailTextRow>
        )}
      </PanelSection>

      {application.status === "pending" && (
        <div className="flex items-center justify-center" style={{ gap: 10 }}>
          <button
            type="button"
            onClick={onCancelApplication}
            className="cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ borderColor: "var(--color-rejected)", color: "var(--color-rejected)" }}
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
            style={{ background: "var(--color-success)" }}
          >
            {t("approve")}
          </button>
        </div>
      )}
    </aside>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <h3
        className="font-bold text-(--color-blue)"
        style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 1.11vw, 16px)", margin: 0 }}
      >
        {title}
      </h3>
      <dl className="flex flex-col" style={{ gap: 8, margin: 0 }}>
        {children}
      </dl>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-baseline"
      style={{ gap: 12, fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
    >
      <dt className="shrink-0 text-(--color-text-secondary)" style={{ width: "clamp(90px, 7vw, 110px)" }}>
        {label}
      </dt>
      <dd
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)"
        style={{ margin: 0 }}
      >
        {children}
      </dd>
    </div>
  );
}

function DetailTextRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}>
      <dt className="mb-1 text-(--color-text-secondary)">{label}</dt>
      <dd className="text-(--color-text-primary)" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {children}
      </dd>
    </div>
  );
}
