"use client";

import { useRef, useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Astroid, ChevronDown, FileText, Upload, X } from "lucide-react";
import type {
  CourseDetail, CourseLesson, CourseModule, CourseTest, LessonDocument, LessonItem,
} from "@/entities/course";
import { deleteLessonDocument, getLessonDetail, updateLesson, uploadLessonDocument } from "@/entities/course";
import { SectionCard } from "@/shared/ui/SectionCard";
import { GradientButton } from "@/shared/ui/GradientButton";
import { MaterialPreviewModal } from "@/shared/ui/MaterialPreviewModal";

const F  = "var(--font-base)";
const FA = "var(--font-accent)";

// ── YouTube embed helper ──────────────────────────────────────────────────────

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// ── Modal scaffold ────────────────────────────────────────────────────────────

function Modal({ wide, onClose, children }: { wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(80px, 10vh, 120px) clamp(16px, 2vw, 32px) clamp(16px, 2vw, 32px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--color-bg)", borderRadius: 24, overflow: "hidden", width: "100%", maxWidth: wide ? 1080 : 900, maxHeight: "78vh", boxShadow: "var(--shadow-modal)" }}
      >
        <div style={{ overflowY: "auto", maxHeight: "78vh", padding: "clamp(24px, 2.08vw, 40px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: "clamp(12px, 0.83vw, 16px)" }}>
      <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: "clamp(16px, 1.25vw, 22px)", color: "var(--color-text-primary)", margin: 0 }}>
        {title}
      </h2>
      <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--color-border-light)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <X size={15} style={{ color: "var(--color-text-secondary)" }} />
      </button>
    </div>
  );
}

function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ItemMeta({ item }: { item: LessonItem }) {
  const t = useTranslations("CourseManagementContentTab");
  const locale = useLocale();
  const chips: { label: string; value: string }[] = [];
  if (item.duration_minutes) chips.push({ label: t("durationLabel"), value: t("minutesShort", { count: item.duration_minutes }) });
  if (item.created_at)       chips.push({ label: t("createdLabel"), value: fmt(item.created_at, locale) });
  if (item.updated_at)       chips.push({ label: t("updatedLabel"), value: fmt(item.updated_at, locale) });
  if (!chips.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginBottom: "clamp(14px, 1.04vw, 20px)", paddingBottom: "clamp(12px, 0.83vw, 16px)", borderBottom: "1px solid var(--color-border-light)" }}>
      {chips.map(({ label, value }) => (
        <span key={label} style={{ fontFamily: F, fontSize: "clamp(11px, 0.73vw, 13px)", color: "var(--color-text-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{label}:</span> {value}
        </span>
      ))}
    </div>
  );
}

// ── Text modal ────────────────────────────────────────────────────────────────

function TextModal({ item, onClose }: { item: LessonItem; onClose: () => void }) {
  const t = useTranslations("CourseManagementContentTab");
  return (
    <Modal onClose={onClose}>
      <ModalHeader title={t("textContent")} onClose={onClose} />
      <ItemMeta item={item} />
      {item.body_html ? (
        <div style={{ fontFamily: F, fontSize: "clamp(13px, 0.9vw, 16px)", color: "var(--color-text-primary)", lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: item.body_html }} />
      ) : (
        <p style={{ fontFamily: F, color: "var(--color-text-muted)" }}>{t("noContent")}</p>
      )}
    </Modal>
  );
}

// ── Video modal ───────────────────────────────────────────────────────────────

function VideoModal({ item, onClose }: { item: LessonItem; onClose: () => void }) {
  const t = useTranslations("CourseManagementContentTab");
  const url   = item.video_url ?? "";
  const embed = url ? youtubeEmbed(url) : null;
  return (
    <Modal wide onClose={onClose}>
      <ModalHeader title={item.original_video_name ?? t("video")} onClose={onClose} />
      <ItemMeta item={item} />
      {!url ? (
        <p style={{ fontFamily: F, color: "var(--color-text-muted)" }}>{t("noVideoUploaded")}</p>
      ) : embed ? (
        <iframe src={embed} title={t("video")} allowFullScreen style={{ width: "100%", aspectRatio: "16 / 9", border: "none", borderRadius: 12 }} />
      ) : (
        <video src={url} controls style={{ width: "100%", borderRadius: 12 }} />
      )}
    </Modal>
  );
}

// ── Test modal ────────────────────────────────────────────────────────────────

function TestModal({ item, test, onClose }: { item: LessonItem; test: CourseTest; onClose: () => void }) {
  const t = useTranslations("CourseManagementContentTab");
  const [revealed, setRevealed] = useState(false);

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={test.title} onClose={onClose} />
      <ItemMeta item={item} />

      <div style={{ display: "flex", gap: 8, marginBottom: test.description ? "clamp(10px, 0.69vw, 12px)" : "clamp(16px, 1.25vw, 24px)" }}>
        <span style={{ fontFamily: FA, fontSize: "clamp(10px, 0.63vw, 12px)", background: "var(--color-brand-lavender-soft)", color: "var(--color-blue-dark)", borderRadius: 99, padding: "2px 10px" }}>
          {t("questionsCount", { count: test.questions.length })}
        </span>
        <span style={{ fontFamily: FA, fontSize: "clamp(10px, 0.63vw, 12px)", background: "rgba(28,187,67,0.1)", color: "var(--color-success)", borderRadius: 99, padding: "2px 10px" }}>
          {t("passLabel", { score: test.passing_score })}
        </span>
      </div>

      {test.description && (
        <p style={{ fontFamily: F, fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 clamp(16px, 1.25vw, 24px)" }}>
          {test.description}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 1.67vw, 28px)" }}>
        {test.questions.map((q, qi) => (
          <div key={q.id ?? qi}>
            <p style={{ fontFamily: F, fontWeight: 600, fontSize: "clamp(13px, 0.9vw, 16px)", color: "var(--color-text-primary)", margin: "0 0 10px" }}>
              {qi + 1}. {q.text}
            </p>

            {q.question_type === "multiple_choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.options.map((opt, oi) => {
                  const correct = revealed && (q.correct_indices?.includes(oi) ?? false);
                  return (
                    <div key={oi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderRadius: 10, background: correct ? "rgba(28,187,67,0.08)" : "var(--color-input-bg)", border: `1px solid ${correct ? "var(--color-success)" : "transparent"}`, fontFamily: F, fontSize: "clamp(12px, 0.83vw, 15px)", color: correct ? "var(--color-success)" : "var(--color-text-primary)", transition: "all 0.2s" }}>
                      <span>{opt}</span>
                      {correct && <span style={{ fontWeight: 700, fontSize: "clamp(10px, 0.63vw, 12px)" }}>✓ {t("correct")}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {q.question_type === "true_false" && (
              <div style={{ display: "flex", gap: 8 }}>
                {([true, false] as const).map(val => {
                  const correct = revealed && val === q.correct_bool;
                  return (
                    <div key={String(val)} style={{ padding: "7px 20px", borderRadius: 99, background: correct ? "rgba(28,187,67,0.08)" : "var(--color-input-bg)", border: `1px solid ${correct ? "var(--color-success)" : "transparent"}`, fontFamily: F, fontWeight: 500, fontSize: "clamp(12px, 0.83vw, 15px)", color: correct ? "var(--color-success)" : "var(--color-text-secondary)", transition: "all 0.2s" }}>
                      {val ? t("trueLabel") : t("falseLabel")}
                    </div>
                  );
                })}
              </div>
            )}

            {q.question_type === "open" && revealed && q.sample_answer && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(28,187,67,0.07)", border: "1px solid var(--color-success)" }}>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: "clamp(11px, 0.73vw, 13px)", color: "var(--color-success)", margin: "0 0 4px" }}>{t("sampleAnswerLabel")}</p>
                <p style={{ fontFamily: F, fontSize: "clamp(12px, 0.83vw, 15px)", color: "var(--color-text-primary)", margin: 0 }}>{q.sample_answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "clamp(20px, 1.67vw, 28px)", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setRevealed(v => !v)}
          style={{ fontFamily: F, fontWeight: 600, fontSize: "clamp(13px, 0.83vw, 15px)", padding: "clamp(8px, 0.63vw, 12px) clamp(18px, 1.46vw, 24px)", borderRadius: 999, cursor: "pointer", transition: "all 0.15s", background: revealed ? "var(--color-text-primary)" : "var(--color-bg)", color: revealed ? "white" : "var(--color-text-primary)", border: "1.5px solid var(--color-text-primary)" }}
        >
          {revealed ? t("hideAnswers") : t("showCorrectAnswers")}
        </button>
      </div>
    </Modal>
  );
}

// ── Modal state type ──────────────────────────────────────────────────────────

type ModalState =
  | { kind: "text";  item: LessonItem }
  | { kind: "video"; item: LessonItem }
  | { kind: "test";  item: LessonItem; test: CourseTest }
  | null;

// ── Item badge config ─────────────────────────────────────────────────────────

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  text:  { bg: "var(--color-brand-lavender-soft)", color: "var(--color-blue-dark)" },
  video: { bg: "rgba(28,187,67,0.1)",              color: "var(--color-success)"   },
  test:  { bg: "rgba(255,141,40,0.1)",             color: "var(--color-warning)"   },
};

// ── Item row (inside expanded lesson) ─────────────────────────────────────────

function ItemRow({ item, onOpen }: { item: LessonItem; onOpen: () => void }) {
  const t = useTranslations("CourseManagementContentTab");
  const [hovered, setHovered] = useState(false);
  const badge = BADGE_STYLE[item.item_type] ?? BADGE_STYLE.text;
  const badgeLabel =
    item.item_type === "test" ? t("badgeTest") : item.item_type === "video" ? t("badgeVideo") : t("badgeText");
  const title =
    item.item_type === "test"  ? (item.test?.title ?? t("testFallback"))
    : item.item_type === "video" ? (item.original_video_name ?? t("video"))
    : t("textContent");

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "clamp(7px, 0.52vw, 10px) clamp(20px, 1.67vw, 28px)", background: hovered ? "var(--color-input-bg)" : "none", border: "none", borderRadius: 10, cursor: "pointer", transition: "background 0.12s", textAlign: "left" }}
    >
      <span style={{ background: badge.bg, color: badge.color, borderRadius: 6, padding: "2px 8px", fontFamily: FA, fontWeight: 600, fontSize: "clamp(10px, 0.63vw, 12px)", flexShrink: 0 }}>
        {badgeLabel}
      </span>
      <span style={{ fontFamily: F, fontSize: "clamp(13px, 0.9vw, 16px)", color: "var(--color-text-primary)" }}>
        {title}
      </span>
    </button>
  );
}

// ── Materials (additional documents) section — manages the live lesson directly, no moderation ──

function MaterialsSection({
  documents, slug, moduleId, lessonId, onChange,
}: {
  documents: LessonDocument[];
  slug: string;
  moduleId: number;
  lessonId: number;
  onChange: (documents: LessonDocument[]) => void;
}) {
  const t = useTranslations("CourseManagementContentTab");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<LessonDocument | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => uploadLessonDocument(slug, moduleId, lessonId, f)));
      onChange([...documents, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: number) {
    const prev = documents;
    onChange(documents.filter(d => d.id !== docId));
    try {
      await deleteLessonDocument(slug, moduleId, lessonId, docId);
    } catch {
      onChange(prev);
    }
  }

  return (
    <div style={{ paddingLeft: "clamp(20px, 1.67vw, 24px)", paddingTop: 6, paddingBottom: 4, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: FA, fontWeight: 600, fontSize: "clamp(10px, 0.63vw, 12px)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {t("materials")}
      </span>

      {documents.map(doc => (
        <div key={doc.id} className="flex items-center justify-between" style={{ gap: 8, padding: "2px 0" }}>
          <button
            type="button"
            onClick={() => setPreview(doc)}
            className="flex items-center transition hover:opacity-70"
            style={{ gap: 8, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
          >
            <FileText size={16} style={{ flexShrink: 0, color: "var(--color-text-secondary)" }} />
            <span style={{ fontFamily: F, fontSize: "clamp(12px, 0.83vw, 15px)", color: "var(--color-blue)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {doc.original_name}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleDelete(doc.id)}
            className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-red-50"
            style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer" }}
            aria-label={t("removeMaterial")}
          >
            <X size={14} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>
      ))}

      {documents.length === 0 && (
        <p style={{ fontFamily: F, fontSize: "clamp(12px, 0.73vw, 14px)", color: "var(--color-text-muted)", margin: 0 }}>
          {t("noAdditionalMaterials")}
        </p>
      )}

      <button
        type="button"
        disabled={uploading}
        onClick={() => docInputRef.current?.click()}
        className="inline-flex items-center self-start transition hover:opacity-80"
        style={{ gap: 6, height: "clamp(28px, 2.22vw, 32px)", background: "var(--color-bg)", border: "1px solid var(--color-draft)", borderRadius: 20, fontFamily: FA, fontWeight: 500, fontSize: "clamp(11px, 0.73vw, 13px)", color: "var(--color-text-primary)", cursor: uploading ? "default" : "pointer", opacity: uploading ? 0.6 : 1, padding: "0 clamp(10px, 0.83vw, 14px)" }}
      >
        <Upload size={14} />
        {uploading ? t("uploading") : t("addMaterial")}
      </button>
      <input
        ref={docInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; void handleUpload(files); }}
      />

      {preview && (
        <MaterialPreviewModal
          key={preview.id}
          title={preview.original_name}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

// ── Lesson row (expandable, lazy-loads items) ─────────────────────────────────

function LessonAccordion({
  lesson, slug, moduleId, onOpen, onUpdated,
}: {
  lesson: CourseLesson;
  slug: string;
  moduleId: number;
  onOpen: (item: LessonItem) => void;
  onUpdated: (lesson: CourseLesson) => void;
}) {
  const t = useTranslations("CourseManagementContentTab");
  const [expanded, setExpanded] = useState(false);
  const [items, setItems]       = useState<LessonItem[] | null>(lesson.items !== undefined ? lesson.items : null);
  const [documents, setDocuments] = useState<LessonDocument[]>(lesson.documents ?? []);
  const [loading, setLoading]   = useState(false);
  const [savingMandatory, setSavingMandatory] = useState(false);

  function toggle() {
    if (!expanded && items === null) {
      setLoading(true);
      getLessonDetail(slug, lesson.id)
        .then(full => { setItems(full.items ?? []); setDocuments(full.documents ?? []); })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
    setExpanded(v => !v);
  }

  async function handleMandatoryChange() {
    setSavingMandatory(true);
    try {
      const updated = await updateLesson(slug, moduleId, lesson.id, { is_mandatory: !lesson.is_mandatory });
      onUpdated(updated);
    } finally {
      setSavingMandatory(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px", width: "100%", padding: "clamp(4px, 0.28vw, 5px) 0" }}>
        <button
          type="button"
          onClick={toggle}
          style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
        >
          <Astroid aria-hidden size={12} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} fill="currentColor" />

          <span style={{ fontFamily: F, fontWeight: 400, fontSize: "clamp(14px, 1.39vw, 20px)", color: "var(--color-text-primary)", flex: 1, minWidth: 0 }}>
            {lesson.title}
          </span>

          {lesson.duration_minutes ? (
            <span style={{ fontFamily: F, fontSize: "clamp(11px, 0.73vw, 13px)", color: "var(--color-text-muted)", flexShrink: 0 }}>
              {t("minutesShort", { count: lesson.duration_minutes })}
            </span>
          ) : null}
        </button>

        <label
          title={t("requiredTooltip")}
          style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: savingMandatory ? "default" : "pointer", opacity: savingMandatory ? 0.6 : 1 }}
        >
          <input
            type="checkbox"
            checked={!!lesson.is_mandatory}
            disabled={savingMandatory}
            onChange={handleMandatoryChange}
          />
          <span style={{ fontFamily: F, fontSize: "clamp(11px, 0.73vw, 13px)", color: "var(--color-text-secondary)" }}>
            {t("mandatory")}
          </span>
        </label>

        <button
          type="button"
          onClick={toggle}
          aria-label={expanded ? t("collapseLesson") : t("expandLesson")}
          style={{ display: "flex", flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ChevronDown size={16} style={{ color: "var(--color-text-muted)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      </div>

      {expanded && (
        <div style={{ paddingLeft: "clamp(20px, 1.67vw, 24px)", paddingTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {loading ? (
            <p style={{ fontFamily: F, fontSize: "clamp(12px, 0.73vw, 14px)", color: "var(--color-text-muted)", margin: 0 }}>{t("loading")}</p>
          ) : (items ?? []).length === 0 ? (
            <p style={{ fontFamily: F, fontSize: "clamp(12px, 0.73vw, 14px)", color: "var(--color-text-muted)", margin: 0 }}>{t("noItemsInLesson")}</p>
          ) : (
            (items ?? []).map(item => (
              <ItemRow key={item.id} item={item} onOpen={() => onOpen(item)} />
            ))
          )}
        </div>
      )}

      {expanded && !loading && (
        <MaterialsSection
          documents={documents}
          slug={slug}
          moduleId={moduleId}
          lessonId={lesson.id}
          onChange={setDocuments}
        />
      )}
    </div>
  );
}

// ── Module row (expandable, public-detail style) ──────────────────────────────

function ModuleAccordion({
  module, index, isOpen, onToggle, slug, onOpen, onLessonUpdated,
}: {
  module: CourseModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  slug: string;
  onOpen: (modal: ModalState) => void;
  onLessonUpdated: (moduleId: number, lesson: CourseLesson) => void;
}) {
  const t = useTranslations("CourseManagementContentTab");
  function openItem(item: LessonItem) {
    if (item.item_type === "text")  onOpen({ kind: "text",  item });
    if (item.item_type === "video") onOpen({ kind: "video", item });
    if (item.item_type === "test" && item.test) onOpen({ kind: "test", item, test: item.test });
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-text-primary)", paddingBlock: "clamp(16px, 1.39vw, 24px)" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ background: "var(--color-brand-lavender-soft)", borderRadius: 20, padding: "0 12px", fontFamily: FA, fontWeight: 600, fontSize: "clamp(14px, 1.39vw, 20px)", lineHeight: "clamp(22px, 1.74vw, 25px)", color: "var(--color-blue)", flexShrink: 0, whiteSpace: "nowrap" as const }}>
          {t("moduleLabel", { number: module.order ?? index + 1 })}
        </span>

        <span style={{ fontFamily: FA, fontWeight: 600, fontSize: "clamp(14px, 1.39vw, 20px)", color: "var(--color-text-primary)", flex: 1 }}>
          {module.title}
        </span>

        <ChevronDown size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {isOpen && (
        <div style={{ marginTop: "clamp(12px, 1.39vw, 20px)", display: "flex", flexDirection: "column", gap: 4 }}>
          {module.lessons.map(lesson => (
            <LessonAccordion
              key={lesson.id}
              lesson={lesson}
              slug={slug}
              moduleId={module.id}
              onOpen={openItem}
              onUpdated={updated => onLessonUpdated(module.id, updated)}
            />
          ))}

          {module.lessons.length === 0 && (
            <p style={{ fontFamily: F, fontSize: "clamp(12px, 0.73vw, 14px)", color: "var(--color-text-muted)", margin: 0 }}>
              {t("noContentInModule")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type Props = {
  course: CourseDetail;
  slug: string;
  onLessonUpdated: (moduleId: number, lesson: CourseLesson) => void;
};

/** Module accordion with expandable lessons, per-item modals (text / video / test). */
export function CourseManagementContentTab({ course, slug, onLessonUpdated }: Props) {
  const t = useTranslations("CourseManagementContentTab");
  const allIds = course.modules.map(m => m.id);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [modal, setModal]             = useState<ModalState>(null);
  const allOpen = allIds.length > 0 && openModules.size === allIds.length;

  function toggleModule(id: number) {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <SectionCard>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(16px, 1.25vw, 24px)" }}>
        <div>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: "clamp(18px, 1.25vw, 24px)", color: "var(--color-text-primary)", margin: "0 0 4px" }}>
            {t("courseStructure")}
          </h2>
          <p style={{ fontFamily: F, fontSize: "clamp(12px, 0.83vw, 15px)", color: "var(--color-text-muted)", margin: 0 }}>
            {t("modulesSubtitle", { count: course.modules.length })}
          </p>
        </div>

        {allIds.length > 0 && (
          <GradientButton type="button" onClick={() => setOpenModules(allOpen ? new Set() : new Set(allIds))}>
            {allOpen ? t("closeAll") : t("openAll")}
          </GradientButton>
        )}
      </div>

      {/* Module list */}
      {course.modules.length === 0 ? (
        <p style={{ fontFamily: F, fontSize: "clamp(13px, 0.83vw, 15px)", color: "var(--color-text-muted)" }}>
          {t("noModulesYet")}
        </p>
      ) : (
        <div>
          {course.modules.map((m, i) => (
            <ModuleAccordion
              key={m.id}
              module={m}
              index={i}
              isOpen={openModules.has(m.id)}
              onToggle={() => toggleModule(m.id)}
              slug={slug}
              onOpen={setModal}
              onLessonUpdated={onLessonUpdated}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal?.kind === "text"  && <TextModal  item={modal.item} onClose={() => setModal(null)} />}
      {modal?.kind === "video" && <VideoModal item={modal.item} onClose={() => setModal(null)} />}
      {modal?.kind === "test"  && <TestModal  item={modal.item} test={modal.test} onClose={() => setModal(null)} />}
    </SectionCard>
  );
}
