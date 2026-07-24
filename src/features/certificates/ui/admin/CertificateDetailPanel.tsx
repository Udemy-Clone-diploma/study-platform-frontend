"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, X } from "lucide-react";
import { setCertificatePublic } from "@/entities/certificate";
import type { Certificate, CertificateActor } from "@/entities/certificate";
import type { ApiError } from "@/shared/api/base";
import { AccentButton } from "@/shared/ui/AccentButton";
import { CertificateStatusBadge } from "./CertificateStatusBadge";
import { formatCertificateDate } from "./CertificatesTable";

function actorName(actor: CertificateActor): string {
  return actor.full_name.trim() || `Administrator #${actor.id}`;
}

type Props = {
  certificate: Certificate;
  onClose: () => void;
  onVisibilityChange: (certificate: Certificate) => void;
};

export function CertificateDetailPanel({ certificate, onClose, onVisibilityChange }: Props) {
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  async function toggleVisibility() {
    setVisibilityLoading(true);
    setVisibilityError(null);
    try {
      onVisibilityChange(await setCertificatePublic(certificate.id, !certificate.is_public));
    } catch (err) {
      setVisibilityError((err as ApiError).message ?? "Could not change visibility.");
    } finally {
      setVisibilityLoading(false);
    }
  }

  return (
    <aside
      aria-label="Certificate details"
      className="flex shrink-0 flex-col rounded-[20px] border border-white bg-(--color-white-20) shadow-(--shadow-usp-glass) backdrop-blur-md"
      style={{
        width: "clamp(300px, 24vw, 360px)",
        padding: "clamp(16px, 1.67vw, 24px)",
        gap: "clamp(14px, 1.25vw, 18px)",
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="overflow-hidden font-mono font-bold text-ellipsis whitespace-nowrap text-(--color-text-primary)"
          style={{ fontSize: "clamp(14px, 1.11vw, 16px)", margin: 0 }}
        >
          {certificate.serial}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-(--color-text-secondary) transition hover:bg-(--color-brand-lavender-soft)"
        >
          <X size={18} />
        </button>
      </div>

      <CertificatePreview url={certificate.certificate_thumbnail_url} serial={certificate.serial} />

      <CertificateStatusBadge
        status={certificate.status}
        superseded={certificate.superseded_by !== null}
      />

      <dl className="flex flex-col" style={{ gap: 10, margin: 0 }}>
        <DetailRow label="Student">{certificate.student.full_name}</DetailRow>
        <DetailRow label="Email">{certificate.student.email}</DetailRow>
        <DetailRow label="Course">
          <Link
            href={`/courses/${certificate.course.slug}`}
            target="_blank"
            className="underline decoration-from-font hover:text-(--color-blue)"
          >
            {certificate.course.title}
          </Link>
        </DetailRow>
        <DetailRow label="Issue date">{formatCertificateDate(certificate.issued_at)}</DetailRow>
        {certificate.final_score && (
          <DetailRow label="Score">{Number(certificate.final_score)}</DetailRow>
        )}
        <DetailRow label="Issued by">
          {certificate.issued_by ? actorName(certificate.issued_by) : "Automatic on completion"}
        </DetailRow>
        {certificate.revoked_at && (
          <DetailRow label="Revoked">{formatCertificateDate(certificate.revoked_at)}</DetailRow>
        )}
        {certificate.revoked_by && (
          <DetailRow label="Revoked by">{actorName(certificate.revoked_by)}</DetailRow>
        )}
        {certificate.restored_at && (
          <DetailRow label="Restored">{formatCertificateDate(certificate.restored_at)}</DetailRow>
        )}
        {certificate.restored_by && (
          <DetailRow label="Restored by">{actorName(certificate.restored_by)}</DetailRow>
        )}
      </dl>

      {certificate.issue_note && (
        <ReasonNote label="Issue note">{certificate.issue_note}</ReasonNote>
      )}

      {certificate.revoke_reason && (
        <ReasonNote label="Revoke reason">{certificate.revoke_reason}</ReasonNote>
      )}

      {certificate.restore_reason && (
        <ReasonNote label="Restore reason">{certificate.restore_reason}</ReasonNote>
      )}

      {certificate.completion_reverted && (
        <ReasonNote label="Cannot be restored">
          The course completion behind this certificate was reverted. Have the student complete the
          course again, or issue a new certificate by hand.
        </ReasonNote>
      )}

      <div className="flex flex-col" style={{ gap: 6 }}>
        <label
          className="flex cursor-pointer items-center"
          style={{
            gap: 8,
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 0.97vw, 15px)",
            color: "var(--color-text-primary)",
          }}
        >
          <input
            type="checkbox"
            checked={certificate.is_public}
            disabled={visibilityLoading}
            onChange={toggleVisibility}
            className="h-4 w-4 shrink-0 cursor-pointer accent-(--color-blue)"
          />
          Publicly verifiable
        </label>
        <span
          className="text-(--color-text-secondary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.83vw, 13px)" }}
        >
          {certificate.is_public
            ? "Anyone with the serial can confirm this certificate."
            : "Public checks of this serial return no result."}
        </span>
        {visibilityError && (
          <span
            className="text-(--color-danger)"
            style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.83vw, 13px)" }}
          >
            {visibilityError}
          </span>
        )}
      </div>

      {!certificate.certificate_url && (
        <span
          className="text-(--color-text-secondary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(11px, 0.83vw, 13px)",
            lineHeight: 1.45,
          }}
        >
          No PDF on file. Re-issue this certificate to generate one.
        </span>
      )}

      {certificate.certificate_url && (
        <AccentButton
          href={certificate.certificate_url}
          size="md"
          style={{ width: "100%", height: "clamp(40px, 3.06vw, 48px)" }}
        >
          Open PDF
        </AccentButton>
      )}
    </aside>
  );
}

function CertificatePreview({ url, serial }: { url: string | null; serial: string }) {
  const [broken, setBroken] = useState(false);

  if (url && !broken) {
    return (
      <span className="relative block w-full overflow-hidden rounded-xl aspect-[297/210]">
        <Image
          src={url}
          alt={`Certificate ${serial}`}
          fill
          unoptimized
          sizes="360px"
          className="object-cover"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="flex w-full items-center justify-center rounded-xl aspect-[297/210] text-(--color-text-primary)"
      style={{ background: "var(--gradient-brand)" }}
    >
      <Award size={32} aria-hidden="true" />
    </span>
  );
}

function ReasonNote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      <span
        className="text-(--color-text-secondary)"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(10px, 0.69vw, 11px)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        className="text-(--color-text-primary)"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(12px, 0.9vw, 14px)",
          lineHeight: 1.45,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-baseline"
      style={{ gap: 12, fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
    >
      <dt
        className="shrink-0 text-(--color-text-secondary)"
        style={{ width: "clamp(72px, 5.5vw, 88px)" }}
      >
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
