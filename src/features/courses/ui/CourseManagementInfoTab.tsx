"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { CourseDetail, CourseLanguage, CourseType } from "@/entities/course";
import { updateCourse, downloadCertificatePreview } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { SectionCard } from "@/shared/ui/SectionCard";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";

// ── Styles matching the profile edit page ─────────────────────────────────────

const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(18px, 1.25vw, 24px)",
  color: "var(--color-text-primary)",
  margin: 0,
};

const HINT: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontSize: "clamp(12px, 0.83vw, 15px)",
  color: "var(--color-text-muted)",
  margin: 0,
};

const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(12px, 1.25vw, 18px)",
  color: "var(--color-text-secondary)",
  letterSpacing: "-0.011em",
  lineHeight: 1.5,
};

const VALUE: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(13px, 1.25vw, 18px)",
  color: "var(--color-text-primary)",
  letterSpacing: "-0.011em",
  lineHeight: 1.5,
};

const INPUT: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(13px, 1.04vw, 16px)",
  color: "var(--color-text-secondary)",
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

// ── Select + option lists ──────────────────────────────────────────────────────

const LANGUAGES: { value: CourseLanguage; label: string }[] = [
  { value: "english",   label: "English" },
  { value: "ukrainian", label: "Ukrainian" },
  { value: "spanish",   label: "Spanish" },
];

const COURSE_TYPES: { value: CourseType; label: string }[] = [
  { value: "profession",    label: "Profession" },
  { value: "qualification", label: "Qualification" },
  { value: "knowledge",     label: "Knowledge" },
];

const LANG_LABEL = Object.fromEntries(LANGUAGES.map(o => [o.value, o.label]));
const TYPE_LABEL = Object.fromEntries(COURSE_TYPES.map(o => [o.value, o.label]));

// ── Custom select (profile-style) ─────────────────────────────────────────────

function CourseSelect({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
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

  const selectedLabel = options.find(o => o.value === value)?.label ?? value;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...INPUT, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", boxSizing: "border-box" }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={14} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", color: "var(--color-text-primary)" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "var(--color-bg)", borderRadius: 16, padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
            <span style={{ ...LABEL, color: "var(--color-text-primary)" }}>{selectedLabel}</span>
            <ChevronDown size={14} style={{ transform: "rotate(180deg)", color: "var(--color-text-primary)" }} />
          </div>
          <div style={{ height: 1, background: "var(--color-border-light)", marginBottom: 4 }} />
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ background: "none", border: "none", padding: "2px 0", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-base)", fontWeight: 400, fontSize: "clamp(13px, 1.04vw, 16px)", lineHeight: 1.4, color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(3px, 0.21vw, 4px)" }}>
      <span style={LABEL}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const pill = (opt: boolean): React.CSSProperties => ({
    padding: "clamp(5px, 0.42vw, 8px) clamp(18px, 1.46vw, 26px)",
    borderRadius: 999,
    border: `1px solid ${value === opt ? "var(--color-text-primary)" : "var(--color-border-light)"}`,
    background: value === opt ? "var(--color-text-primary)" : "transparent",
    color: value === opt ? "white" : "var(--color-text-secondary)",
    cursor: "pointer",
    fontFamily: "var(--font-base)",
    fontSize: "clamp(13px, 0.83vw, 16px)",
    fontWeight: 500,
    letterSpacing: "-0.011em",
    transition: "all 0.15s",
  });
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {([true, false] as const).map(opt => (
        <button key={String(opt)} type="button" onClick={() => onChange(opt)} style={pill(opt)}>
          {opt ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────────

type Form = {
  subtitle:                 string;
  language:                 string;
  course_type:              string;
  with_certificate:         boolean;
  certificate_description:  string;
  is_on_sale:               boolean;
  passing_score:            string;
};

// ── Main component ─────────────────────────────────────────────────────────────

type Props = {
  course: CourseDetail;
  slug: string;
  onCourseUpdated: (updates: Partial<CourseDetail>) => void;
  onTabChange: (tab: string) => void;
};

/** Editable course settings that aren't part of the creation basics. */
export function CourseManagementInfoTab({ course, slug, onCourseUpdated }: Props) {
  const init = (): Form => ({
    subtitle:                course.subtitle ?? "",
    language:                course.language,
    course_type:             course.course_type,
    with_certificate:        course.with_certificate,
    certificate_description: course.certificate_description ?? "",
    is_on_sale:               course.is_on_sale,
    passing_score:            String(course.passing_score),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState<Form>(init);
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  function startEdit()  { setForm(init()); setSaveErr(null); setEditing(true); }
  function cancelEdit() { setEditing(false); setSaveErr(null); }

  async function save() {
    setSaving(true);
    setSaveErr(null);
    const passingScore = Math.min(100, Math.max(1, parseInt(form.passing_score, 10) || 80));
    try {
      await updateCourse(slug, { ...form, passing_score: passingScore });
      onCourseUpdated({
        subtitle:                form.subtitle,
        language:                form.language as CourseLanguage,
        course_type:             form.course_type as CourseType,
        with_certificate:        form.with_certificate,
        certificate_description: form.certificate_description,
        is_on_sale:              form.is_on_sale,
        passing_score:           passingScore,
      });
      setEditing(false);
    } catch (err) {
      const apiError = err as ApiError;
      const certificateField = apiError.fields?.with_certificate ?? apiError.fields?.certificate_description;
      const certificateMsg = Array.isArray(certificateField) ? certificateField[0] : certificateField;
      setSaveErr(certificateMsg ?? apiError.message ?? "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function previewCertificate() {
    if (previewing) return;
    setPreviewing(true);
    setPreviewErr(null);
    try {
      const blob = await downloadCertificatePreview(slug);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      setPreviewErr("Could not generate certificate preview.");
    } finally {
      setPreviewing(false);
    }
  }

  const divider = <div style={{ gridColumn: "1 / -1", height: 1, background: "var(--color-border-light)" }} />;

  return (
    <SectionCard>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: "clamp(20px, 1.67vw, 32px)" }}>
        <div>
          <h2 style={HEADING}>Course Settings</h2>
          <p style={{ ...HINT, marginTop: 4 }}>
            Fields not covered in the creation basics — update them here anytime.
          </p>
        </div>
        {!editing ? (
          <AccentButton type="button" size="sm" onClick={startEdit}>Edit</AccentButton>
        ) : (
          <div style={{ display: "flex", gap: "clamp(8px, 0.69vw, 12px)", flexShrink: 0 }}>
            <WhiteButton onClick={cancelEdit} icon={null}>Cancel</WhiteButton>
            <AccentButton type="button" size="sm" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </AccentButton>
          </div>
        )}
      </div>

      {/* Fields grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(20px, 1.67vw, 32px) clamp(40px, 8.75vw, 140px)" }}>

        {/* Row 1: Language | Course Type */}
        <Field label="Language">
          {editing
            ? <CourseSelect options={LANGUAGES} value={form.language} onChange={v => set("language", v)} />
            : <span style={VALUE}>{LANG_LABEL[course.language] ?? course.language}</span>
          }
        </Field>

        <Field label="Course Type">
          {editing
            ? <CourseSelect options={COURSE_TYPES} value={form.course_type} onChange={v => set("course_type", v)} />
            : <span style={VALUE}>{TYPE_LABEL[course.course_type] ?? course.course_type}</span>
          }
        </Field>

        {divider}

        {/* Row 2: Certificate | On Sale */}
        <Field label="Certificate">
          {editing
            ? <Toggle value={form.with_certificate} onChange={v => set("with_certificate", v)} />
            : <span style={VALUE}>{course.with_certificate ? "Yes" : "No"}</span>
          }
          {!editing && course.with_certificate && (
            <div style={{ marginTop: "clamp(6px, 0.42vw, 8px)" }}>
              <WhiteButton type="button" icon={null} onClick={previewCertificate} disabled={previewing}>
                {previewing ? "Generating…" : "Preview certificate"}
              </WhiteButton>
              {previewErr && (
                <p style={{ marginTop: 4, fontFamily: "var(--font-base)", fontSize: "clamp(11px, 0.63vw, 13px)", color: "var(--color-danger)" }}>
                  {previewErr}
                </p>
              )}
            </div>
          )}
        </Field>

        <Field label="On Sale">
          {editing
            ? <Toggle value={form.is_on_sale} onChange={v => set("is_on_sale", v)} />
            : <span style={VALUE}>{course.is_on_sale ? "Yes" : "No"}</span>
          }
        </Field>

        {(editing ? form.with_certificate : course.with_certificate) && (
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Certificate Description">
              {editing
                ? <textarea
                    value={form.certificate_description}
                    onChange={e => set("certificate_description", e.target.value)}
                    placeholder="What did the student master? Printed on the certificate…"
                    rows={3}
                    style={{ ...INPUT, borderRadius: 20, resize: "vertical" }}
                  />
                : <span style={VALUE}>{course.certificate_description || "—"}</span>
              }
              {!editing && (
                <p style={{ ...HINT, marginTop: 4 }}>
                  Required before the certificate can be enabled — printed on the certificate PDF.
                </p>
              )}
            </Field>
          </div>
        )}

        {divider}

        {/* Row 3: Passing score */}
        <Field label="Passing Score (%)">
          {editing
            ? <input
                type="number"
                min={1}
                max={100}
                value={form.passing_score}
                onChange={e => set("passing_score", e.target.value)}
                style={INPUT}
              />
            : <span style={VALUE}>{course.passing_score}%</span>
          }
        </Field>

        {divider}

        {/* Subtitle — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Subtitle">
            {editing
              ? <input
                  value={form.subtitle}
                  onChange={e => set("subtitle", e.target.value)}
                  placeholder="A short tagline shown under the course title…"
                  style={INPUT}
                />
              : <span style={VALUE}>{course.subtitle || "—"}</span>
            }
          </Field>
          {!editing && (
            <p style={{ ...HINT, marginTop: 4 }}>
              Not the same as the short description — this is an optional marketing hook under the title.
            </p>
          )}
        </div>
      </div>

      {saveErr && (
        <p style={{ marginTop: "clamp(8px, 0.63vw, 12px)", fontFamily: "var(--font-base)", fontSize: "clamp(12px, 0.73vw, 14px)", color: "var(--color-danger)" }}>
          {saveErr}
        </p>
      )}
    </SectionCard>
  );
}
