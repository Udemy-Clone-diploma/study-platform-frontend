"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BadgeCheck, CircleAlert, CircleX, Search } from "lucide-react";
import { verifyCertificate } from "@/entities/certificate";
import type { CertificateVerification } from "@/entities/certificate";
import type { ApiError } from "@/shared/api/base";
import { AccentButton } from "@/shared/ui/AccentButton";
import { PageShell } from "@/shared/ui/PageShell";

type Result =
  | { kind: "found"; data: CertificateVerification }
  | { kind: "missing" }
  | { kind: "error"; message: string };

function formatIssuedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function CertificateVerifyView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serial = (searchParams.get("serial") ?? "").trim();
  const t = useTranslations("CertificateVerify");

  const [input, setInput] = useState(serial);
  const [prevSerial, setPrevSerial] = useState(serial);
  const [result, setResult] = useState<Result | null>(null);
  const [loadedSerial, setLoadedSerial] = useState<string | null>(null);

  if (serial !== prevSerial) {
    setPrevSerial(serial);
    setInput(serial);
  }

  const loading = serial !== "" && loadedSerial !== serial;
  const shownResult = serial !== "" && !loading ? result : null;

  useEffect(() => {
    if (!serial) return;
    let cancelled = false;
    verifyCertificate(serial)
      .then((data) => {
        if (cancelled) return;
        setResult({ kind: "found", data });
        setLoadedSerial(serial);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiError = err as ApiError;
        if (apiError.status === 404) setResult({ kind: "missing" });
        else if (apiError.status === 429)
          setResult({
            kind: "error",
            message: t("tooManyChecks"),
          });
        else
          setResult({
            kind: "error",
            message: apiError.message ?? t("genericError"),
          });
        setLoadedSerial(serial);
      });
    return () => {
      cancelled = true;
    };
  }, [serial]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = input.trim();
    if (!next) return;
    router.push(`/verify?serial=${encodeURIComponent(next)}`, { scroll: false });
  }

  return (
    <PageShell>
      <div className="flex w-full flex-col" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1
          className="font-semibold text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(24px, 2.5vw, 36px)",
            margin: "0 0 clamp(8px, 0.83vw, 12px)",
          }}
        >
          {t("title")}
        </h1>
        <p
          className="text-(--color-text-secondary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(13px, 1.11vw, 16px)",
            lineHeight: 1.5,
            margin: "0 0 clamp(20px, 2.22vw, 32px)",
          }}
        >
          {t("description")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-center" style={{ gap: 12 }}>
          <label
            className="gradient-border flex flex-1 cursor-text items-center gap-2"
            style={{
              minWidth: "clamp(200px, 24vw, 320px)",
              height: "clamp(44px, 3.61vw, 52px)",
              borderRadius: 40,
              padding: "clamp(6px, 0.56vw, 8px) clamp(14px, 1.25vw, 20px)",
            }}
          >
            <Search
              aria-hidden="true"
              className="shrink-0 text-(--color-text-secondary)"
              style={{ width: "clamp(16px, 1.39vw, 20px)", height: "clamp(16px, 1.39vw, 20px)" }}
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("serialLabel")}
              aria-label={t("serialLabel")}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-mono outline-none"
              style={{
                fontSize: "clamp(14px, 1.11vw, 18px)",
                color: "var(--color-text-primary)",
              }}
            />
          </label>
          <AccentButton
            type="submit"
            size="md"
            disabled={loading || !input.trim()}
            style={{
              minWidth: "clamp(120px, 10vw, 160px)",
              height: "clamp(44px, 3.61vw, 52px)",
              fontSize: "clamp(14px, 1.11vw, 18px)",
            }}
          >
            {loading ? t("checking") : t("verify")}
          </AccentButton>
        </form>

        <div aria-live="polite" style={{ marginTop: "clamp(20px, 2.22vw, 32px)" }}>
          {shownResult?.kind === "found" && <VerificationCard data={shownResult.data} />}
          {shownResult?.kind === "missing" && (
            <ResultShell
              icon={<CircleAlert size={28} aria-hidden="true" />}
              accent="var(--color-text-secondary)"
              title={t("notFoundTitle")}
              body={t("notFoundBody")}
            />
          )}
          {shownResult?.kind === "error" && (
            <ResultShell
              icon={<CircleAlert size={28} aria-hidden="true" />}
              accent="var(--color-rejected)"
              title={t("errorTitle")}
              body={shownResult.message}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function VerificationCard({ data }: { data: CertificateVerification }) {
  const revoked = data.status === "revoked";
  const t = useTranslations("CertificateVerify");

  const body = revoked
    ? data.revoked_at
      ? t("issuedAndRevokedOn", {
          issuedDate: formatIssuedDate(data.issued_at),
          revokedDate: formatIssuedDate(data.revoked_at),
        })
      : t("issuedAndRevoked", { issuedDate: formatIssuedDate(data.issued_at) })
    : t("issuedOn", { date: formatIssuedDate(data.issued_at) });

  return (
    <ResultShell
      icon={
        revoked ? (
          <CircleX size={28} aria-hidden="true" />
        ) : (
          <BadgeCheck size={28} aria-hidden="true" />
        )
      }
      accent={revoked ? "var(--color-rejected)" : "var(--color-success)"}
      title={revoked ? t("revokedTitle") : t("validTitle")}
      body={body}
    >
      <dl
        className="flex flex-col"
        style={{ gap: 10, margin: "clamp(16px, 1.67vw, 24px) 0 0", padding: 0 }}
      >
        <DetailRow label={t("student")} value={data.student_name} />
        <DetailRow label={t("course")} value={data.course_title} />
        <DetailRow label={t("serial")} value={data.serial} mono />
        {data.superseded_by_serial && (
          <DetailRow label={t("replacedBy")} value={data.superseded_by_serial} mono />
        )}
      </dl>
    </ResultShell>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline" style={{ gap: 8 }}>
      <dt
        className="text-(--color-text-secondary)"
        style={{
          fontFamily: "var(--font-base)",
          fontSize: "clamp(12px, 0.97vw, 14px)",
          minWidth: 110,
        }}
      >
        {label}
      </dt>
      <dd
        className={`min-w-0 text-(--color-text-primary) ${mono ? "font-mono" : ""}`}
        style={{
          fontFamily: mono ? undefined : "var(--font-base)",
          fontSize: "clamp(13px, 1.11vw, 16px)",
          margin: 0,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function ResultShell({
  icon,
  accent,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="w-full rounded-2xl bg-white"
      style={{
        boxShadow: "var(--shadow-dashboard-card)",
        padding: "clamp(20px, 2.08vw, 32px)",
        borderTop: `4px solid ${accent}`,
      }}
    >
      <div className="flex items-start" style={{ gap: 12 }}>
        <span className="shrink-0" style={{ color: accent }}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2
            className="font-semibold text-(--color-text-primary)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(16px, 1.39vw, 20px)",
              margin: "0 0 6px",
            }}
          >
            {title}
          </h2>
          <p
            className="text-(--color-text-secondary)"
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(13px, 1.11vw, 16px)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {body}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
