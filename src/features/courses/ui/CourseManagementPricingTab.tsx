"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import type { CourseDetail } from "@/entities/course";
import type {
  CourseDeliveryFormat,
  CourseDeliveryFormatPayload,
  DeliveryFormatType,
} from "@/entities/course";
import {
  createDeliveryFormat,
  updateDeliveryFormat,
  deleteDeliveryFormat,
} from "@/entities/course";

// ── constants ──────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<DeliveryFormatType, string> = {
  self_paced:  "Self-paced",
  scheduled:   "Scheduled",
  individual:  "Individual (1-on-1)",
  group:       "Group",
};

const FORMAT_DESCRIPTIONS: Record<DeliveryFormatType, string> = {
  self_paced:  "Student studies on their own schedule, access to all content immediately.",
  scheduled:   "Content unlocks on a fixed schedule from the course start date.",
  individual:  "One-on-one sessions with the teacher.",
  group:       "Cohort-based learning, group start dates managed in the Cohorts tab.",
};

const ALL_FORMATS: DeliveryFormatType[] = ["self_paced", "scheduled", "individual", "group"];
const CURRENCY_OPTIONS = ["USD", "EUR", "UAH"] as const;

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
  const INPUT: React.CSSProperties = {
    width: "100%",
    background: "var(--color-input-bg)",
    border: "1.5px solid var(--color-border-light)",
    borderRadius: 10,
    padding: "clamp(8px, 0.63vw, 10px) clamp(10px, 0.83vw, 14px)",
    fontFamily: "var(--font-base)",
    fontSize: "clamp(13px, 0.83vw, 15px)",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const LABEL: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-base)",
    fontSize: "clamp(11px, 0.72vw, 13px)",
    color: "var(--color-text-secondary)",
    marginBottom: 4,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>Price</label>
          <input
            type="number" min="0" step="0.01"
            value={price}
            onChange={e => onChange("price", e.target.value)}
            placeholder="0.00"
            style={INPUT}
          />
        </div>
        <div style={{ width: 100 }}>
          <label style={LABEL}>Currency</label>
          <select value={currency} onChange={e => onChange("currency", e.target.value)} style={{ ...INPUT, width: 100 }}>
            {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" as const }}>
        <input type="checkbox" checked={installments} onChange={e => onChange("installments", e.target.checked)} />
        <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-secondary)" }}>
          Allow installment payments
        </span>
      </label>

      {installments && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL}>Installment count</label>
            <input
              type="number" min="2"
              value={installmentCount}
              onChange={e => onChange("installmentCount", e.target.value)}
              placeholder="e.g. 4"
              style={INPUT}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL}>Amount per installment</label>
            <input
              type="number"
              value={installmentAmount}
              readOnly
              placeholder="—"
              style={{ ...INPUT, background: "var(--color-bg)", color: "var(--color-text-secondary)", cursor: "default" }}
            />
          </div>
        </div>
      )}
    </div>
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [price, setPrice]                         = useState(fmt.pricing?.price ?? "");
  const [currency, setCurrency]                   = useState<"USD"|"EUR"|"UAH">(fmt.pricing?.currency ?? "USD");
  const [installments, setInstallments]           = useState(fmt.pricing?.installment_count != null);
  const [installmentCount, setInstallmentCount]   = useState(String(fmt.pricing?.installment_count ?? ""));
  const [installmentAmount, setInstallmentAmount] = useState(fmt.pricing?.installment_amount ?? "");

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
      const updated = await updateDeliveryFormat(slug, fmt.id, {
        pricing: {
          price,
          currency,
          installment_count:  installments && installmentCount  ? Number(installmentCount)  : null,
          installment_amount: installments && installmentAmount ? installmentAmount : null,
        },
      });
      onUpdated(updated);
      setEditing(false);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove the "${FORMAT_LABELS[fmt.format_type]}" format? This will also delete its pricing plan.`)) return;
    try {
      await deleteDeliveryFormat(slug, fmt.id);
      onDeleted(fmt.id);
    } catch {
      alert("Failed to delete format.");
    }
  }

  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(16px, 1.25vw, 22px)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: editing ? 16 : 0 }}>
        <div>
          <div style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 0.94vw, 17px)", color: "var(--color-text-primary)" }}>
            {FORMAT_LABELS[fmt.format_type]}
          </div>
          {!editing && (
            <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-secondary)", marginTop: 4 }}>
              {fmt.pricing
                ? `${fmt.pricing.currency} ${fmt.pricing.price}${fmt.pricing.installment_count ? ` · ${fmt.pricing.installment_count}× installments` : ""}`
                : "No price set"}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!editing ? (
            <>
              <IconBtn onClick={() => setEditing(true)} title="Edit pricing"><Pencil size={14} /></IconBtn>
              <IconBtn onClick={handleDelete} title="Remove format" danger><Trash2 size={14} /></IconBtn>
            </>
          ) : (
            <>
              <IconBtn onClick={handleSave} title="Save" accent disabled={saving}><Check size={14} /></IconBtn>
              <IconBtn onClick={() => { setEditing(false); setError(null); }} title="Cancel"><X size={14} /></IconBtn>
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
          {error && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-rejected)", marginTop: 8, marginBottom: 0 }}>
              {error}
            </p>
          )}
        </>
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
  const available = ALL_FORMATS.filter(f => !existingTypes.includes(f));
  const [selected, setSelected]                   = useState<DeliveryFormatType>(available[0] ?? "self_paced");
  const [price, setPrice]                         = useState("");
  const [currency, setCurrency]                   = useState<"USD"|"EUR"|"UAH">("USD");
  const [installments, setInstallments]           = useState(false);
  const [installmentCount, setInstallmentCount]   = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

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
      setError((e as { message?: string })?.message ?? "Failed to create.");
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
          Add delivery format
        </span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {available.length === 0 ? (
        <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.78vw, 14px)", color: "var(--color-text-muted)", margin: 0 }}>
          All delivery formats are already configured.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {available.map(f => (
              <button key={f} type="button" onClick={() => setSelected(f)} style={TYPE_BTN(selected === f)}>
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)", margin: 0 }}>
            {FORMAT_DESCRIPTIONS[selected]}
          </p>

          <PricingFields
            price={price} currency={currency}
            installments={installments}
            installmentCount={installmentCount}
            installmentAmount={installmentAmount}
            onChange={handleChange}
          />

          {error && (
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-rejected)", margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              style={{
                background: "var(--gradient-brand)",
                border: "none",
                borderRadius: 10,
                padding: "clamp(8px, 0.63vw, 10px) clamp(16px, 1.25vw, 22px)",
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: "clamp(12px, 0.78vw, 14px)",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Creating…" : "Create"}
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
}: {
  course: CourseDetail;
  slug: string;
}) {
  const [formats, setFormats] = useState<CourseDeliveryFormat[]>(course.delivery_formats);
  const [adding, setAdding]   = useState(false);

  function handleUpdated(updated: CourseDeliveryFormat) {
    setFormats(prev => prev.map(f => (f.id === updated.id ? updated : f)));
  }
  function handleDeleted(id: number) {
    setFormats(prev => prev.filter(f => f.id !== id));
  }
  function handleCreated(fmt: CourseDeliveryFormat) {
    setFormats(prev => [...prev, fmt]);
    setAdding(false);
  }

  const existingTypes = formats.map(f => f.format_type);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(12px, 1.04vw, 18px)" }}>
        <h2 style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(15px, 1.04vw, 19px)", color: "var(--color-text-primary)", margin: 0 }}>
          Delivery formats &amp; pricing
        </h2>
        {!adding && existingTypes.length < ALL_FORMATS.length && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--gradient-brand)", border: "none", borderRadius: 10,
              padding: "clamp(7px, 0.52vw, 10px) clamp(12px, 1.04vw, 18px)",
              fontFamily: "var(--font-base)", fontWeight: 700,
              fontSize: "clamp(12px, 0.78vw, 14px)", color: "#fff", cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add format
          </button>
        )}
      </div>

      {formats.length === 0 && !adding && (
        <div style={{
          border: "1.5px dashed var(--color-border-light)", borderRadius: 16,
          padding: "clamp(24px, 2.08vw, 40px)", textAlign: "center",
          color: "var(--color-text-muted)", fontFamily: "var(--font-base)",
          fontSize: "clamp(13px, 0.83vw, 15px)",
        }}>
          No delivery formats configured yet. Add one to set pricing for this course.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {formats.map(fmt => (
          <FormatCard key={fmt.id} fmt={fmt} slug={slug} onUpdated={handleUpdated} onDeleted={handleDeleted} />
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
