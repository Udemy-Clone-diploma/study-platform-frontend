"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X, Check, Lock, LockOpen } from "lucide-react";
import { AddButton } from "@/shared/ui/AddButton";
import { ModalShell } from "@/shared/ui/ModalShell";
import type { CourseDetail } from "@/entities/course";
import type {
  CourseDeliveryFormat,
  CourseDeliveryFormatPayload,
  DeliveryFormatType,
} from "@/entities/course";
import {
  createDeliveryFormat,
  deleteDeliveryFormat,
  updateDeliveryFormat,
} from "@/entities/course";

// ── constants ──────────────────────────────────────────────────────────────

const ALL_FORMATS: DeliveryFormatType[] = ["self_paced", "scheduled", "individual", "group"];
const CURRENCY_OPTIONS: Array<{ value: "USD" | "EUR" | "UAH"; label: string }> = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "UAH", label: "UAH" },
];

function getLocalIsoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Shared field styles ────────────────────────────────────────────────────

const FIELD_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(12px, 0.83vw, 14px)",
  color: "var(--color-text-secondary)",
  letterSpacing: "-0.011em",
  lineHeight: 1.5,
  marginBottom: 4,
  display: "block",
};

const PILL_INPUT: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(13px, 1.04vw, 16px)",
  color: "var(--color-text-primary)",
  letterSpacing: "-0.011em",
  lineHeight: 1.5,
  background: "var(--color-bg)",
  border: "1px solid var(--color-text-primary)",
  borderRadius: 999,
  padding: "clamp(6px, 0.52vw, 10px) clamp(12px, 1.04vw, 20px)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const PILL_INPUT_READONLY: React.CSSProperties = {
  ...PILL_INPUT,
  color: "var(--color-text-secondary)",
  borderColor: "var(--color-border-light)",
  cursor: "default",
};

// ── CurrencySelect ─────────────────────────────────────────────────────────

function CurrencySelect({
  value,
  onChange,
}: {
  value: "USD" | "EUR" | "UAH";
  onChange: (v: "USD" | "EUR" | "UAH") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: 110 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...PILL_INPUT, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <span>{value}</span>
        <ChevronDown size={13} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "#fff", borderRadius: 14, padding: "8px 0", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border-light)" }}>
          {CURRENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ display: "block", width: "100%", background: "none", border: "none", padding: "6px 16px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-base)", fontSize: "clamp(13px, 1.04vw, 15px)", color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)", fontWeight: opt.value === value ? 600 : 400 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── InstallmentToggle ──────────────────────────────────────────────────────

function InstallmentToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const t = useTranslations("CourseManagementPricingTab");
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "clamp(5px, 0.42vw, 8px) clamp(16px, 1.25vw, 22px)",
    borderRadius: 999,
    border: `1px solid ${active ? "var(--color-text-primary)" : "var(--color-border-light)"}`,
    background: active ? "var(--color-text-primary)" : "transparent",
    color: active ? "#fff" : "var(--color-text-secondary)",
    cursor: "pointer",
    fontFamily: "var(--font-base)",
    fontSize: "clamp(12px, 0.83vw, 14px)",
    fontWeight: 500,
    letterSpacing: "-0.011em",
    transition: "all 0.15s",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={FIELD_LABEL}>{t("installments")}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={pill(!value)} onClick={() => onChange(false)}>{t("off")}</button>
        <button type="button" style={pill(value)}  onClick={() => onChange(true)}>{t("on")}</button>
      </div>
    </div>
  );
}

// ── PricingFields ──────────────────────────────────────────────────────────

type PricingFieldsProps = {
  price: string;
  currency: "USD" | "EUR" | "UAH";
  installments: boolean;
  installmentCount: string;
  installmentAmount: string;
  onChange: (key: string, value: string | boolean) => void;
};

function PricingFields({
  price, currency, installments, installmentCount, installmentAmount, onChange,
}: PricingFieldsProps) {
  const t = useTranslations("CourseManagementPricingTab");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={FIELD_LABEL}>{t("price")}</label>
          <input
            type="number" min="0" step="0.01"
            value={price}
            onChange={e => onChange("price", e.target.value)}
            placeholder="0.00"
            style={PILL_INPUT}
          />
        </div>
        <div style={{ paddingBottom: 0 }}>
          <label style={FIELD_LABEL}>{t("currency")}</label>
          <CurrencySelect value={currency} onChange={v => onChange("currency", v)} />
        </div>
      </div>

      <InstallmentToggle value={installments} onChange={v => onChange("installments", v)} />

      {installments && (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={FIELD_LABEL}>{t("installmentCount")}</label>
            <input
              type="number" min="2"
              value={installmentCount}
              onChange={e => onChange("installmentCount", e.target.value)}
              placeholder={t("installmentCountPlaceholder")}
              style={PILL_INPUT}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={FIELD_LABEL}>{t("amountPerInstallment")}</label>
            <input
              type="number"
              value={installmentAmount}
              readOnly
              placeholder="—"
              style={PILL_INPUT_READONLY}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── RemoveFormatModal ──────────────────────────────────────────────────────────

function RemoveFormatModal({
  fmt,
  onDelete,
  onCloseEnrollment,
  onCancel,
}: {
  fmt: CourseDeliveryFormat;
  onDelete: () => Promise<void>;
  onCloseEnrollment: () => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("CourseManagementPricingTab");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStudents = (fmt.enrolled_count ?? 0) > 0;
  const name = t(`formatLabel.${fmt.format_type}`);

  async function handleAction() {
    setBusy(true);
    setError(null);
    try {
      if (hasStudents) {
        await onCloseEnrollment();
      } else {
        await onDelete();
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  const title = hasStudents ? t("formatHasStudents") : t("removeFormatTitle", { name });

  const BTN_BASE: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontWeight: 600,
    fontSize: "clamp(12px, 0.83vw, 14px)", borderRadius: 999,
    padding: "7px 18px", cursor: busy ? "not-allowed" : "pointer",
    border: "none", opacity: busy ? 0.6 : 1,
  };

  return (
    <ModalShell onClose={onCancel} title={title} width="clamp(320px, 30vw, 460px)">
      <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
        {hasStudents
          ? t.rich("enrolledMessage", {
              count: fmt.enrolled_count,
              name,
              strong: chunks => <strong>{chunks}</strong>,
            })
          : t("deleteConfirm")}
      </p>
      {error && (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-danger)", marginTop: 8, marginBottom: 0 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
        <button
          type="button" onClick={onCancel} disabled={busy}
          style={{ ...BTN_BASE, background: "none", border: "1px solid var(--color-border-light)", color: "var(--color-text-secondary)" }}
        >
          {t("cancel")}
        </button>
        <button
          type="button" onClick={handleAction} disabled={busy}
          style={{ ...BTN_BASE, background: "var(--color-text-primary)", color: "#fff" }}
        >
          {busy ? t("saving") : hasStudents ? t("closeEnrollment") : t("remove")}
        </button>
      </div>
    </ModalShell>
  );
}

// ── FormatCard ─────────────────────────────────────────────────────────────

type FormatCardProps = {
  fmt: CourseDeliveryFormat;
  slug: string;
  onUpdated: (fmt: CourseDeliveryFormat) => void;
  onDeleted: (id: number) => void;
};

function FormatCard({ fmt, slug, onUpdated, onDeleted }: FormatCardProps) {
  const t = useTranslations("CourseManagementPricingTab");
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [enrollmentDeadline, setEnrollmentDeadline] = useState(fmt.enrollment_deadline ?? "");

  const today   = getLocalIsoDate();
  const isClosed = !!fmt.enrollment_deadline && fmt.enrollment_deadline < today;
  const isFull   = fmt.max_students != null && fmt.enrolled_count >= fmt.max_students;

  async function handleToggleEnrollment() {
    setToggling(true);
    try {
      const updated = await updateDeliveryFormat(slug, fmt.id, {
        enrollment_deadline: isClosed ? null : getLocalIsoDate(-1),
      });
      setEnrollmentDeadline(updated.enrollment_deadline ?? "");
      onUpdated(updated);
    } finally {
      setToggling(false);
    }
  }

  const [price, setPrice]                         = useState(fmt.pricing?.price ?? "");
  const [currency, setCurrency]                   = useState<"USD"|"EUR"|"UAH">(fmt.pricing?.currency ?? "USD");
  const [installments, setInstallments]           = useState(fmt.pricing?.installment_count != null);
  const [installmentCount, setInstallmentCount]   = useState(String(fmt.pricing?.installment_count ?? ""));
  const [installmentAmount, setInstallmentAmount] = useState(fmt.pricing?.installment_amount ?? "");
  const [maxStudents, setMaxStudents]             = useState(String(fmt.max_students ?? ""));

  function handleChange(key: string, value: string | boolean) {
    if (key === "price") {
      setPrice(value as string);
      if (installments && installmentCount) {
        const count = Number(installmentCount);
        if (count >= 2) setInstallmentAmount((Number(value) / count).toFixed(2));
      }
    } else if (key === "currency") {
      setCurrency(value as "USD"|"EUR"|"UAH");
    } else if (key === "installments") {
      setInstallments(value as boolean);
    } else if (key === "installmentCount") {
      setInstallmentCount(value as string);
      const count = Number(value);
      if (count >= 2 && price) setInstallmentAmount((Number(price) / count).toFixed(2));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: Parameters<typeof updateDeliveryFormat>[2] = {
        pricing: {
          price,
          currency,
          installment_count:  installments && installmentCount  ? Number(installmentCount)  : null,
          installment_amount: installments && installmentAmount ? installmentAmount : null,
        },
      };
      if (fmt.format_type === "individual") {
        payload.max_students = maxStudents.trim() !== "" ? Number(maxStudents) : null;
      }
      if (fmt.format_type === "group") {
        payload.enrollment_deadline = enrollmentDeadline || null;
      }
      const updated = await updateDeliveryFormat(slug, fmt.id, payload);
      onUpdated(updated);
      setEditing(false);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t("errorSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteDeliveryFormat(slug, fmt.id);
    onDeleted(fmt.id);
  }

  async function handleCloseEnrollment() {
    const updated = await updateDeliveryFormat(slug, fmt.id, {
      enrollment_deadline: getLocalIsoDate(-1),
    });
    setEnrollmentDeadline(updated.enrollment_deadline ?? "");
    onUpdated(updated);
    setShowRemoveModal(false);
  }

  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(16px, 1.25vw, 22px)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: editing ? 16 : 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 0.94vw, 17px)", color: "var(--color-text-primary)" }}>
              {t(`formatLabel.${fmt.format_type}`)}
            </span>
            {!editing && (() => {
              const label = isFull ? t("statusFull") : isClosed ? t("statusClosed") : t("statusOpen");
              const color = isFull ? "var(--color-text-muted)" : isClosed ? "var(--color-rejected)" : "var(--color-success)";
              const bg    = isFull ? "var(--color-bg)" : isClosed ? "#fff3f3" : "#f0faf0";
              const bdr   = isFull ? "var(--color-border-light)" : isClosed ? "#ffc5c5" : "#b8e6b8";
              return (
                <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(10px, 0.63vw, 12px)", color, background: bg, border: `1px solid ${bdr}`, borderRadius: 999, padding: "2px 10px" }}>
                  {label}
                </span>
              );
            })()}
          </div>
          {!editing && (
            <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-secondary)", marginTop: 4 }}>
              {fmt.pricing
                ? `${fmt.pricing.currency} ${fmt.pricing.price}${fmt.pricing.installment_count ? ` · ${t("installmentsSuffix", { count: fmt.pricing.installment_count })}` : ""}`
                : t("noPriceSet")}
              {fmt.format_type === "individual" && fmt.max_students != null && (
                <span style={{ marginLeft: 8 }}>&middot; {t("spotsCount", { count: fmt.max_students })}</span>
              )}
              {fmt.format_type === "group" && fmt.enrollment_deadline && (
                <span style={{ marginLeft: 8, color: isClosed ? "var(--color-rejected)" : undefined }}>&middot; {t("deadline", { date: fmt.enrollment_deadline })}</span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!editing ? (
            <>
              <IconBtn
                onClick={handleToggleEnrollment}
                title={isFull ? t("formatIsFull") : isClosed ? t("reopenEnrollment") : t("closeEnrollment")}
                disabled={toggling || isFull}
              >
                {isClosed ? <LockOpen size={14} /> : <Lock size={14} />}
              </IconBtn>
              <IconBtn onClick={() => setEditing(true)} title={t("editPricing")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </IconBtn>
              <IconBtn onClick={() => setShowRemoveModal(true)} title={t("removeFormat")} danger>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </IconBtn>
            </>
          ) : (
            <>
              <IconBtn onClick={handleSave} title={t("save")} accent disabled={saving}><Check size={14} /></IconBtn>
              <IconBtn onClick={() => { setEditing(false); setError(null); }} title={t("cancel")}><X size={14} /></IconBtn>
            </>
          )}
        </div>
      </div>

      {editing && (
        <>
          <PricingFields
            price={price} currency={currency}
            installments={installments}
            installmentCount={installmentCount}
            installmentAmount={installmentAmount}
            onChange={handleChange}
          />
          {fmt.format_type === "individual" && (
            <div style={{ marginTop: 12 }}>
              <label style={FIELD_LABEL}>{t("maxStudents")}</label>
              <input
                type="number"
                min={1}
                value={maxStudents}
                onChange={e => setMaxStudents(e.target.value)}
                placeholder={t("unlimited")}
                style={{ ...PILL_INPUT, width: 180 }}
              />
            </div>
          )}
          {fmt.format_type === "group" && (
            <div className="mt-3 max-w-xs">
              <label style={FIELD_LABEL}>{t("enrollmentDeadline")}</label>
              <input
                type="date"
                value={enrollmentDeadline}
                onChange={e => setEnrollmentDeadline(e.target.value)}
                style={PILL_INPUT}
              />
              <p className="mt-1.5 mb-0 font-(family-name:--font-base) text-xs text-(--color-text-muted)">
                {t("enrollmentDeadlineHint")}
              </p>
            </div>
          )}
          {error && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-rejected)", marginTop: 8, marginBottom: 0 }}>
              {error}
            </p>
          )}
        </>
      )}

      {showRemoveModal && (
        <RemoveFormatModal
          fmt={fmt}
          onDelete={handleDelete}
          onCloseEnrollment={handleCloseEnrollment}
          onCancel={() => setShowRemoveModal(false)}
        />
      )}
    </div>
  );
}

// ── AddFormatPanel ─────────────────────────────────────────────────────────

type AddFormatPanelProps = {
  slug: string;
  existingTypes: DeliveryFormatType[];
  onCreated: (fmt: CourseDeliveryFormat) => void;
  onClose: () => void;
};

function AddFormatPanel({ slug, existingTypes, onCreated, onClose }: AddFormatPanelProps) {
  const t = useTranslations("CourseManagementPricingTab");
  const available = ALL_FORMATS.filter(f => !existingTypes.includes(f));
  const [selected, setSelected]                   = useState<DeliveryFormatType>(available[0] ?? "self_paced");
  const [price, setPrice]                         = useState("");
  const [currency, setCurrency]                   = useState<"USD"|"EUR"|"UAH">("USD");
  const [installments, setInstallments]           = useState(false);
  const [installmentCount, setInstallmentCount]   = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [enrollmentDeadline, setEnrollmentDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const isGroupDeadlineMissing = selected === "group" && !enrollmentDeadline;
  const createDisabled = saving || isGroupDeadlineMissing;

  function handleChange(key: string, value: string | boolean) {
    if (key === "price") {
      setPrice(value as string);
      if (installments && installmentCount) {
        const count = Number(installmentCount);
        if (count >= 2) setInstallmentAmount((Number(value) / count).toFixed(2));
      }
    } else if (key === "currency") {
      setCurrency(value as "USD"|"EUR"|"UAH");
    } else if (key === "installments") {
      setInstallments(value as boolean);
    } else if (key === "installmentCount") {
      setInstallmentCount(value as string);
      const count = Number(value);
      if (count >= 2 && price) setInstallmentAmount((Number(price) / count).toFixed(2));
    }
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const payload: CourseDeliveryFormatPayload = {
        format_type: selected,
        ...(selected === "group" ? {
          enrollment_deadline: enrollmentDeadline,
        } : {}),
        ...(price ? {
          pricing: {
            price,
            currency,
            installment_count:  installments && installmentCount  ? Number(installmentCount)  : null,
            installment_amount: installments && installmentAmount ? installmentAmount : null,
          },
        } : {}),
      };
      const fmt = await createDeliveryFormat(slug, payload);
      onCreated(fmt);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? t("errorCreateFailed"));
    } finally {
      setSaving(false);
    }
  }

  const TYPE_BTN = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "clamp(8px, 0.63vw, 12px) clamp(10px, 0.83vw, 16px)",
    borderRadius: 10,
    border: active ? "2px solid transparent" : "1.5px solid var(--color-border-light)",
    background: active
      ? "linear-gradient(var(--color-bg), var(--color-bg)) padding-box, var(--gradient-brand) border-box"
      : "var(--color-bg)",
    fontFamily: "var(--font-base)",
    fontWeight: active ? 700 : 400,
    fontSize: "clamp(12px, 0.78vw, 14px)",
    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    cursor: "pointer",
    textAlign: "center" as const,
    transition: "all 0.15s",
  });

  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(16px, 1.25vw, 22px)", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-primary)" }}>
          {t("addDeliveryFormat")}
        </span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {available.length === 0 ? (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)", margin: 0 }}>
          {t("allFormatsConfigured")}
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {available.map(f => (
              <button key={f} type="button" onClick={() => setSelected(f)} style={TYPE_BTN(selected === f)}>
                {t(`formatLabel.${f}`)}
              </button>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)", margin: 0 }}>
            {t(`formatDescription.${selected}`)}
          </p>

          <PricingFields
            price={price} currency={currency}
            installments={installments}
            installmentCount={installmentCount}
            installmentAmount={installmentAmount}
            onChange={handleChange}
          />

          {selected === "group" && (
            <div className="max-w-xs">
              <label style={FIELD_LABEL}>{t("enrollmentDeadline")}</label>
              <input
                type="date"
                value={enrollmentDeadline}
                onChange={e => setEnrollmentDeadline(e.target.value)}
                required
                style={PILL_INPUT}
              />
              <p className="mt-1.5 mb-0 font-(family-name:--font-base) text-xs text-(--color-text-muted)">
                {t("enrollmentDeadlineRequiredHint")}
              </p>
            </div>
          )}

          {error && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-rejected)", margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createDisabled}
              style={{
                background: "var(--gradient-brand)",
                border: "none",
                borderRadius: 10,
                padding: "clamp(8px, 0.63vw, 10px) clamp(16px, 1.25vw, 22px)",
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: "clamp(12px, 0.78vw, 14px)",
                color: "#fff",
                cursor: createDisabled ? "not-allowed" : "pointer",
                opacity: createDisabled ? 0.7 : 1,
              }}
            >
              {saving ? t("creating") : t("create")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── IconBtn ────────────────────────────────────────────────────────────────

function IconBtn({ children, onClick, title, danger, accent, disabled }: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 8,
        border: "1.5px solid var(--color-border-light)",
        background: accent ? "var(--gradient-brand)" : "var(--color-bg)",
        color: danger ? "var(--color-rejected)" : accent ? "#fff" : "var(--color-text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

/** Pricing & delivery format configuration tab for the teacher course management page. */
export function CourseManagementPricingTab({
  course,
  slug,
  onFormatsChanged,
}: {
  course: CourseDetail;
  slug: string;
  onFormatsChanged?: (formats: CourseDeliveryFormat[]) => void;
}) {
  const t = useTranslations("CourseManagementPricingTab");
  const [formats, setFormats] = useState<CourseDeliveryFormat[]>(course.delivery_formats);
  const [adding, setAdding]   = useState(false);

  function updateFormats(next: CourseDeliveryFormat[]) {
    setFormats(next);
    onFormatsChanged?.(next);
  }

  function handleUpdated(updated: CourseDeliveryFormat) {
    updateFormats(formats.map(f => (f.id === updated.id ? updated : f)));
  }
  function handleDeleted(id: number) {
    updateFormats(formats.filter(f => f.id !== id));
  }
  function handleCreated(fmt: CourseDeliveryFormat) {
    updateFormats([...formats, fmt]);
    setAdding(false);
  }

  const existingTypes = formats.map(f => f.format_type);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(12px, 1.04vw, 18px)" }}>
        <h2 style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(15px, 1.04vw, 19px)", color: "var(--color-text-primary)", margin: 0 }}>
          {t("heading")}
        </h2>
        {!adding && existingTypes.length < ALL_FORMATS.length && (
          <AddButton onClick={() => setAdding(true)}>{t("addFormat")}</AddButton>
        )}
      </div>

      {formats.length === 0 && !adding && (
        <div style={{
          border: "1.5px dashed var(--color-border-light)", borderRadius: 16,
          padding: "clamp(24px, 2.08vw, 40px)", textAlign: "center",
          color: "var(--color-text-muted)", fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 0.83vw, 15px)",
        }}>
          {t("noFormatsYet")}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {formats.map(fmt => (
          <FormatCard
            key={fmt.id}
            fmt={fmt}
            slug={slug}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
        {adding && (
          <div style={{ gridColumn: "1 / -1" }}>
            <AddFormatPanel
              slug={slug}
              existingTypes={existingTypes}
              onCreated={handleCreated}
              onClose={() => setAdding(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
