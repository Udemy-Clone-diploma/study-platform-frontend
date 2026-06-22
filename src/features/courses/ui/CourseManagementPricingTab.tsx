"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Pencil, Trash2, X, Check, Lock, LockOpen } from "lucide-react";
import type { CourseCohort, CourseDetail } from "@/entities/course";
import type {
  CourseDeliveryFormat,
  CourseDeliveryFormatPayload,
  DeliveryFormatType,
} from "@/entities/course";
import type { CohortInput } from "@/entities/course";
import {
  createCohort,
  createDeliveryFormat,
  deleteCohort,
  deleteDeliveryFormat,
  updateCohort,
  updateDeliveryFormat,
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
const CURRENCY_OPTIONS: Array<{ value: "USD" | "EUR" | "UAH"; label: string }> = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "UAH", label: "UAH" },
];

// ── Shared field styles (matching CourseManagementInfoTab) ─────────────────

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
      <span style={FIELD_LABEL}>Installments</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={pill(!value)} onClick={() => onChange(false)}>Off</button>
        <button type="button" style={pill(value)}  onClick={() => onChange(true)}>On</button>
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={FIELD_LABEL}>Price</label>
          <input
            type="number" min="0" step="0.01"
            value={price}
            onChange={e => onChange("price", e.target.value)}
            placeholder="0.00"
            style={PILL_INPUT}
          />
        </div>
        <div style={{ paddingBottom: 0 }}>
          <label style={FIELD_LABEL}>Currency</label>
          <CurrencySelect value={currency} onChange={v => onChange("currency", v)} />
        </div>
      </div>

      <InstallmentToggle value={installments} onChange={v => onChange("installments", v)} />

      {installments && (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={FIELD_LABEL}>Installment count</label>
            <input
              type="number" min="2"
              value={installmentCount}
              onChange={e => onChange("installmentCount", e.target.value)}
              placeholder="e.g. 4"
              style={PILL_INPUT}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={FIELD_LABEL}>Amount per installment</label>
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

// ── CohortRow ──────────────────────────────────────────────────────────────

function CohortRow({ cohort, slug, onDeleted, onUpdated }: {
  cohort: CourseCohort;
  slug: string;
  onDeleted: (id: number) => void;
  onUpdated: (c: CourseCohort) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [name, setName]               = useState(cohort.name ?? "");
  const [startDate, setStartDate]     = useState(cohort.start_date ?? "");
  const [deadline, setDeadline]       = useState(cohort.enrollment_deadline ?? "");
  const [durationMonths, setDuration] = useState(String(cohort.duration_months || ""));
  const [hoursPerWeek, setHoursPerWeek] = useState(String(cohort.hours_per_week || ""));
  const [groupSize, setGroupSize]     = useState(String(cohort.group_size ?? ""));

  function openEdit() {
    setName(cohort.name ?? "");
    setStartDate(cohort.start_date ?? "");
    setDeadline(cohort.enrollment_deadline ?? "");
    setDuration(String(cohort.duration_months || ""));
    setHoursPerWeek(String(cohort.hours_per_week || ""));
    setGroupSize(String(cohort.group_size ?? ""));
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCohort(slug, cohort.id, {
        name:            name.trim() || null,
        start_date:         startDate || null,
        enrollment_deadline: deadline || null,
        duration_months:    Number(durationMonths) || 0,
        hours_per_week: Number(hoursPerWeek) || 0,
        group_size:     groupSize ? Number(groupSize) : null,
      });
      onUpdated(updated);
      setEditing(false);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleOpen() {
    setToggling(true);
    try {
      const updated = await updateCohort(slug, cohort.id, { is_enrollment_open: !cohort.is_enrollment_open });
      onUpdated(updated);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this cohort?")) return;
    setDeleting(true);
    try {
      await deleteCohort(slug, cohort.id);
      onDeleted(cohort.id);
    } catch {
      alert("Failed to delete cohort.");
      setDeleting(false);
    }
  }

  const inputSm: React.CSSProperties = { ...PILL_INPUT, fontSize: "clamp(11px, 0.72vw, 13px)", padding: "5px 12px" };
  const labelSm: React.CSSProperties = { ...FIELD_LABEL, fontSize: "clamp(10px, 0.63vw, 12px)" };

  if (editing) {
    return (
      <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-text-primary)", display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <label style={labelSm}>Group name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Group A" style={{ ...inputSm, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div><label style={labelSm}>Start date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputSm} /></div>
          <div><label style={labelSm}>Deadline</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputSm} /></div>
          <div><label style={labelSm}>Duration (months)</label><input type="number" min={0} value={durationMonths} onChange={e => setDuration(e.target.value)} placeholder="0" style={inputSm} /></div>
          <div><label style={labelSm}>h/week</label><input type="number" min={0} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} placeholder="0" style={inputSm} /></div>
          <div><label style={labelSm}>Max group size</label><input type="number" min={1} value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="—" style={inputSm} /></div>
        </div>
        {error && <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-rejected)", margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button" onClick={handleSave} disabled={saving}
            style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(11px, 0.72vw, 13px)", background: "var(--color-text-primary)", color: "#fff", border: "none", borderRadius: 999, padding: "5px 14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button" onClick={() => setEditing(false)}
            style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)", background: "none", border: "1px solid var(--color-border-light)", borderRadius: 999, padding: "5px 14px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isFull = !!(cohort.group_size && cohort.members_count >= cohort.group_size);
  const isOpen = cohort.is_enrollment_open;

  const parts: string[] = [];
  if (cohort.name) parts.push(cohort.name);
  if (cohort.start_date) parts.push(`Starts ${cohort.start_date}`);
  if (cohort.enrollment_deadline) parts.push(`Deadline ${cohort.enrollment_deadline}`);
  if (cohort.duration_months) parts.push(`${cohort.duration_months} mo`);
  if (cohort.hours_per_week) parts.push(`${cohort.hours_per_week} h/wk`);
  if (cohort.group_size) parts.push(`${cohort.members_count}/${cohort.group_size}`);

  const statusColor = isFull ? "var(--color-text-muted)" : isOpen ? "var(--color-success)" : "var(--color-rejected)";
  const statusLabel = isFull ? "Full" : isOpen ? "Open" : "Closed";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)" }}>
          {parts.length ? parts.join(" · ") : "No schedule set"}
        </span>
        <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(10px, 0.63vw, 11px)", fontWeight: 600, color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button" onClick={handleToggleOpen} disabled={toggling || isFull}
          title={isFull ? "Group is full" : isOpen ? "Close enrollment" : "Open enrollment"}
          style={{ background: "none", border: "none", cursor: toggling || isFull ? "not-allowed" : "pointer", color: isOpen && !isFull ? "var(--color-success)" : "var(--color-text-muted)", display: "flex", alignItems: "center", padding: 4, opacity: toggling ? 0.5 : 1 }}
        >
          {isOpen && !isFull ? <LockOpen size={12} /> : <Lock size={12} />}
        </button>
        <button
          type="button" onClick={openEdit}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", padding: 4 }}
          title="Edit cohort"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button" onClick={handleDelete} disabled={deleting}
          style={{ background: "none", border: "none", cursor: deleting ? "not-allowed" : "pointer", color: "var(--color-rejected)", display: "flex", alignItems: "center", padding: 4, opacity: deleting ? 0.5 : 1 }}
          title="Delete cohort"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── AddCohortForm ──────────────────────────────────────────────────────────

function AddCohortForm({ slug, formatId, onCreated, onClose }: {
  slug: string;
  formatId: number;
  onCreated: (c: CourseCohort) => void;
  onClose: () => void;
}) {
  const [name, setName]                 = useState("");
  const [startDate, setStartDate]       = useState("");
  const [deadline, setDeadline]         = useState("");
  const [durationMonths, setDuration]   = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [groupSize, setGroupSize]       = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const payload: CohortInput = {
        delivery_format:    formatId,
        name:               name.trim() || null,
        duration_months:    Number(durationMonths) || 0,
        hours_per_week:     Number(hoursPerWeek) || 0,
        group_size:         groupSize ? Number(groupSize) : null,
        start_date:         startDate || null,
        enrollment_deadline: deadline || null,
        is_enrollment_open: true,
      };
      const cohort = await createCohort(slug, payload);
      onCreated(cohort);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to create cohort.");
    } finally {
      setSaving(false);
    }
  }

  const inputSm: React.CSSProperties = { ...PILL_INPUT, fontSize: "clamp(11px, 0.72vw, 13px)", padding: "5px 12px" };
  const labelSm: React.CSSProperties = { ...FIELD_LABEL, fontSize: "clamp(10px, 0.63vw, 12px)" };

  return (
    <div style={{ padding: "12px", borderRadius: 10, background: "#f9f9fb", border: "1px dashed var(--color-border-light)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ marginBottom: 6 }}>
        <label style={labelSm}>Group name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Group A" style={{ ...inputSm, width: "100%", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div><label style={labelSm}>Start date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputSm} /></div>
        <div><label style={labelSm}>Deadline</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputSm} /></div>
        <div><label style={labelSm}>Duration (months)</label><input type="number" min={0} value={durationMonths} onChange={e => setDuration(e.target.value)} placeholder="0" style={inputSm} /></div>
        <div><label style={labelSm}>h/week</label><input type="number" min={0} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} placeholder="0" style={inputSm} /></div>
        <div><label style={labelSm}>Max group size</label><input type="number" min={1} value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="—" style={inputSm} /></div>
      </div>
      {error && <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-rejected)", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button" onClick={handleCreate} disabled={saving}
          style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(11px, 0.72vw, 13px)", background: "var(--color-text-primary)", color: "#fff", border: "none", borderRadius: 999, padding: "6px 16px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Creating…" : "Create"}
        </button>
        <button
          type="button" onClick={onClose}
          style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)", background: "none", border: "1px solid var(--color-border-light)", borderRadius: 999, padding: "6px 16px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── FormatCard ─────────────────────────────────────────────────────────────

type FormatCardProps = {
  fmt: CourseDeliveryFormat;
  slug: string;
  cohorts: CourseCohort[];
  onUpdated: (fmt: CourseDeliveryFormat) => void;
  onDeleted: (id: number) => void;
  onCohortCreated: (c: CourseCohort) => void;
  onCohortUpdated: (c: CourseCohort) => void;
  onCohortDeleted: (id: number) => void;
};

function FormatCard({ fmt, slug, cohorts, onUpdated, onDeleted, onCohortCreated, onCohortUpdated, onCohortDeleted }: FormatCardProps) {
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [addingCohort, setAddingCohort] = useState(false);

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

      {fmt.format_type === "group" && (
        <>
          <div style={{ height: 1, background: "var(--color-border-light)", margin: "12px 0 10px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Cohorts ({cohorts.length})
            </span>
            {!addingCohort && (
              <button
                type="button"
                onClick={() => setAddingCohort(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(11px, 0.72vw, 13px)", color: "var(--color-blue)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Plus size={12} /> Add cohort
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cohorts.map(c => (
              <CohortRow key={c.id} cohort={c} slug={slug} onDeleted={onCohortDeleted} onUpdated={onCohortUpdated} />
            ))}
          </div>
          {addingCohort && (
            <div style={{ marginTop: cohorts.length ? 8 : 0 }}>
              <AddCohortForm
                slug={slug}
                formatId={fmt.id}
                onCreated={c => { onCohortCreated(c); setAddingCohort(false); }}
                onClose={() => setAddingCohort(false)}
              />
            </div>
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
  onCohortsChanged,
}: {
  course: CourseDetail;
  slug: string;
  onCohortsChanged?: (cohorts: CourseCohort[]) => void;
}) {
  const [formats, setFormats] = useState<CourseDeliveryFormat[]>(course.delivery_formats);
  const [cohorts, setCohorts] = useState<CourseCohort[]>(course.cohorts);
  const [adding, setAdding]   = useState(false);

  function updateCohorts(next: CourseCohort[]) {
    setCohorts(next);
    onCohortsChanged?.(next);
  }

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
  function handleCohortCreated(c: CourseCohort) {
    updateCohorts([...cohorts, c]);
  }
  function handleCohortUpdated(c: CourseCohort) {
    updateCohorts(cohorts.map(x => (x.id === c.id ? c : x)));
  }
  function handleCohortDeleted(id: number) {
    updateCohorts(cohorts.filter(c => c.id !== id));
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

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {formats.map(fmt => (
          <FormatCard
            key={fmt.id}
            fmt={fmt}
            slug={slug}
            cohorts={cohorts.filter(c => c.delivery_format === fmt.id)}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onCohortCreated={handleCohortCreated}
            onCohortUpdated={handleCohortUpdated}
            onCohortDeleted={handleCohortDeleted}
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
