"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Play, Upload, FileText, X } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import type { LessonDocument } from "@/entities/course";

export type LessonFormValues = {
  title: string;
  content: string;
  video_file: File | null;
  video_url?: string;
  original_video_name?: string;
  duration_minutes: string;
  min_score: string;
  /** Existing documents from server */
  existing_documents?: LessonDocument[];
  /** New files selected by user (not yet uploaded) */
  new_documents: File[];
  /** IDs of existing documents to delete on save */
  deleted_document_ids: number[];
};

const EMPTY: LessonFormValues = {
  title: "",
  content: "",
  video_file: null,
  video_url: undefined,
  duration_minutes: "",
  min_score: "70",
  existing_documents: [],
  new_documents: [],
  deleted_document_ids: [],
};

type Props = {
  mode: "add" | "edit";
  initialValues?: Partial<LessonFormValues>;
  onClose: () => void;
  onSave: (values: LessonFormValues) => Promise<void>;
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-primary)",
  marginBottom: "clamp(8px, 0.83vw, 12px)",
};

const inputSt: React.CSSProperties = {
  display: "block",
  width: "100%",
  backgroundColor: "var(--color-input-bg)",
  border: "none",
  borderRadius: 12,
  padding: "clamp(12px, 1.39vw, 20px)",
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const hintSt: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(12px, 1.39vw, 20px)",
  color: "var(--color-text-secondary)",
  marginTop: 8,
};

/** Modal dialog for creating or editing a course lesson. */
export function LessonFormModal({ mode, initialValues = {}, onClose, onSave }: Props) {
  const [values, setValues] = useState<LessonFormValues>({ ...EMPTY, ...initialValues });
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, video_file: e.target.files?.[0] ?? null }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.title.trim()) return;
    setLoading(true);
    try {
      await onSave(values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      title={mode === "add" ? "Add Lesson" : "Edit Lesson"}
      icon={<Play size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />}
      width="clamp(480px, 81.39vw, 1200px)"
      padding="clamp(20px, 2.78vw, 40px) clamp(24px, 3.47vw, 50px)"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 20px)" }}>

          {/* Lesson Title */}
          <div>
            <label htmlFor="lesson-title" style={labelSt}>Lesson Title*</label>
            <input
              ref={titleRef}
              id="lesson-title"
              name="title"
              type="text"
              value={values.title}
              onChange={handleChange}
              placeholder="Text"
              required
              style={inputSt}
            />
          </div>

          {/* Lesson Content */}
          <div>
            <label htmlFor="lesson-content" style={labelSt}>Lesson Content</label>
            <textarea
              id="lesson-content"
              name="content"
              value={values.content}
              onChange={handleChange}
              placeholder="Write your lesson content here... You can include text, instructions, and explanations."
              style={{
                ...inputSt,
                minHeight: "clamp(160px, 22.22vw, 320px)",
                resize: "vertical",
                color: values.content ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              }}
            />
            <p style={hintSt}>This is the main content students will read during the lesson.</p>
          </div>

          {/* Lesson Video */}
          <div>
            <label style={labelSt}>Lesson Video</label>
            <div
              style={{
                border: "2px dashed var(--color-draft)",
                borderRadius: 16,
                minHeight: "clamp(160px, 22.22vw, 320px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(12px, 1.39vw, 20px)",
                padding: "clamp(16px, 1.67vw, 24px)",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
                <Upload
                  size={80}
                  style={{ width: "clamp(40px, 5.56vw, 80px)", height: "clamp(40px, 5.56vw, 80px)", color: "var(--color-text-secondary)" }}
                />
                <div className="flex flex-col items-center" style={{ gap: "clamp(4px, 0.56vw, 8px)" }}>
                  <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(16px, 1.67vw, 24px)", color: "var(--color-text-secondary)", textAlign: "center" }}>
                    {values.video_file
                      ? values.video_file.name
                      : values.original_video_name
                        ? values.original_video_name
                        : values.video_url
                          ? "Video uploaded"
                          : "Upload a video for this lesson"}
                  </span>
                  {!values.video_file && !values.video_url && (
                    <span style={{ fontFamily: "var(--font-base)", fontWeight: 400, fontSize: "clamp(12px, 1.39vw, 20px)", color: "var(--color-text-secondary)" }}>
                      MP4, MOV, AVI up to 500MB
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="inline-flex items-center justify-center transition hover:opacity-80"
                style={{
                  gap: "clamp(6px, 0.69vw, 10px)",
                  minWidth: "clamp(160px, 13.89vw, 200px)",
                  height: "clamp(38px, 3.06vw, 44px)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-draft)",
                  borderRadius: 28,
                  fontFamily: "var(--font-accent)",
                  fontWeight: 500,
                  fontSize: "clamp(14px, 1.39vw, 20px)",
                  letterSpacing: "-0.011em",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Upload size={20} />
                {values.video_file || values.video_url ? "Replace File" : "Choose File"}
              </button>
            </div>
            <p style={hintSt}>Optional: Add a video to accompany this lesson content</p>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>

          {/* Documents */}
          <div>
            <label style={labelSt}>Documents</label>
            <div
              style={{
                border: "2px dashed var(--color-draft)",
                borderRadius: 16,
                minHeight: "clamp(100px, 8vw, 140px)",
                display: "flex",
                flexDirection: "column",
                gap: "clamp(8px, 0.83vw, 12px)",
                padding: "clamp(12px, 1.25vw, 18px) clamp(16px, 1.67vw, 24px)",
              }}
            >
              {/* Existing + new queued files */}
              {(values.existing_documents ?? []).filter(d => !values.deleted_document_ids.includes(d.id)).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between" style={{ gap: 8 }}>
                  <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                    <FileText size={18} style={{ flexShrink: 0, color: "var(--color-text-secondary)" }} />
                    <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 1.04vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.original_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValues(p => ({ ...p, deleted_document_ids: [...p.deleted_document_ids, doc.id] }))}
                    className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-red-50"
                    style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer" }}
                    aria-label="Remove document"
                  >
                    <X size={16} style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                </div>
              ))}
              {values.new_documents.map((file, i) => (
                <div key={i} className="flex items-center justify-between" style={{ gap: 8 }}>
                  <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                    <FileText size={18} style={{ flexShrink: 0, color: "var(--color-text-secondary)" }} />
                    <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 1.04vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-secondary)" }}>
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValues(p => ({ ...p, new_documents: p.new_documents.filter((_, j) => j !== i) }))}
                    className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-red-50"
                    style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer" }}
                    aria-label="Remove file"
                  >
                    <X size={16} style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                </div>
              ))}
              {/* Add button */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="inline-flex items-center self-start transition hover:opacity-80"
                style={{
                  gap: "clamp(6px, 0.69vw, 10px)",
                  height: "clamp(38px, 3.06vw, 44px)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-draft)",
                  borderRadius: 28,
                  fontFamily: "var(--font-accent)",
                  fontWeight: 500,
                  fontSize: "clamp(14px, 1.39vw, 20px)",
                  letterSpacing: "-0.011em",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  padding: "0 clamp(12px, 1.25vw, 18px)",
                }}
              >
                <Upload size={18} />
                Add Documents
              </button>
              <input
                ref={docInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setValues(p => ({ ...p, new_documents: [...p.new_documents, ...files] }));
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
            </div>
            <p style={hintSt}>PDF, DOCX, XLSX and other files</p>
          </div>

          {/* Duration + Min Score */}
          <div className="grid grid-cols-2" style={{ gap: "clamp(16px, 2.78vw, 40px)" }}>
            <div>
              <div className="flex items-center" style={{ gap: 4, marginBottom: "clamp(8px, 0.83vw, 12px)" }}>
                <Clock size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
                <label htmlFor="lesson-duration" style={{ ...labelSt, marginBottom: 0 }}>Duration (minutes)</label>
              </div>
              <input
                id="lesson-duration"
                name="duration_minutes"
                type="number"
                min="1"
                value={values.duration_minutes}
                onChange={handleChange}
                placeholder="0"
                style={{ ...inputSt, padding: "clamp(10px, 0.83vw, 12px) clamp(16px, 1.39vw, 20px)" }}
              />
            </div>
            <div>
              <label htmlFor="lesson-min-score" style={labelSt}>Minimum Score (optional)</label>
              <input
                id="lesson-min-score"
                name="min_score"
                type="number"
                min="0"
                max="100"
                value={values.min_score}
                onChange={handleChange}
                placeholder="3"
                style={{ ...inputSt, padding: "clamp(10px, 0.83vw, 12px) clamp(16px, 1.39vw, 20px)" }}
              />
            </div>
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          submitLabel="Save Lesson"
          loading={loading}
          disabled={!values.title.trim() || loading}
        />
      </form>
    </ModalShell>
  );
}
