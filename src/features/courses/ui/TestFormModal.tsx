"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Clock, HelpCircle, Plus, Trash2 } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";

export type TestQuestion = {
  _key: string;
  id?: number;
  type: string;
  text: string;
  options: [string, string, string, string];
  correct_index: number;
  correct_bool: boolean;
  sample_answer: string;
};

export type TestFormValues = {
  title: string;
  passing_score: string;
  duration_minutes: string;
  description: string;
  questions: TestQuestion[];
};

const EMPTY: TestFormValues = {
  title: "",
  passing_score: "70",
  duration_minutes: "",
  description: "",
  questions: [],
};

function makeQuestion(): TestQuestion {
  return {
    _key: Math.random().toString(36).slice(2),
    type: "multiple_choice",
    text: "",
    options: ["", "", "", ""],
    correct_index: 0,
    correct_bool: true,
    sample_answer: "",
  };
}

const labelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-primary)",
  marginBottom: 12,
};

const inputSt: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "var(--color-input-bg)",
  border: "none",
  borderRadius: 12,
  padding: "16px",
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box" as const,
};

const hintSt: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(13px, 1.39vw, 20px)",
  color: "var(--color-text-secondary)",
  marginTop: 0,
};

function StyledSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputSt,
          appearance: "none",
          WebkitAppearance: "none",
          paddingRight: 48,
          cursor: "pointer",
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={20}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--color-text-primary)",
        }}
      />
    </div>
  );
}

function QuestionCard({
  question,
  index,
  readOnly = false,
  onRemove,
  onUpdate,
  onUpdateOption,
}: {
  question: TestQuestion;
  index: number;
  readOnly?: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<TestQuestion>) => void;
  onUpdateOption: (idx: number, val: string) => void;
}) {
  const cardSt: React.CSSProperties = {
    border: "2px solid var(--color-border-light)",
    borderRadius: 16,
    padding: "clamp(16px, 1.39vw, 20px)",
    display: "flex",
    flexDirection: "column",
    gap: "clamp(16px, 1.39vw, 20px)",
  };

  return (
    <div style={cardSt}>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 1.39vw, 20px)", lineHeight: "25px", color: "var(--color-text-primary)" }}>
          Question {index + 1}
        </span>
        {!readOnly && (
          <button type="button" onClick={onRemove}
            className="flex items-center justify-center rounded-full transition hover:bg-red-50"
            style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
            aria-label="Remove question">
            <Trash2 size={18} style={{ color: "var(--color-text-primary)" }} />
          </button>
        )}
      </div>

      <div>
        <label style={labelSt}>Question Type</label>
        {readOnly
          ? <div style={inputSt}>{question.type.replace("_", " ")}</div>
          : (
            <StyledSelect value={question.type} onChange={(v) => onUpdate({ type: v })}>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short answer</option>
            </StyledSelect>
          )}
      </div>

      <div>
        <label style={labelSt}>Question Text</label>
        <input type="text" value={question.text}
          onChange={readOnly ? undefined : (e) => onUpdate({ text: e.target.value })}
          readOnly={readOnly}
          placeholder="Enter your question here..."
          style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
        />
      </div>

      {question.type === "multiple_choice" && (
        <div>
          <label style={labelSt}>Answer Options</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {question.options.map((opt, oi) => {
              const isCorrect = question.correct_index === oi;
              return (
                <div key={oi} className="flex items-center" style={{ gap: 12 }}>
                  <div style={{ flexShrink: 0, width: 20, height: 20, border: "1px solid var(--color-blue)", borderRadius: 2, background: isCorrect ? "var(--color-catalog-category-active)" : "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: readOnly ? "default" : "pointer" }}
                    onClick={readOnly ? undefined : () => onUpdate({ correct_index: oi })}
                    role={readOnly ? undefined : "button"}
                    aria-label={readOnly ? undefined : `Mark option ${oi + 1} as correct`}>
                    {isCorrect && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="var(--color-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <input type="text" value={opt}
                    onChange={readOnly ? undefined : (e) => onUpdateOption(oi, e.target.value)}
                    readOnly={readOnly}
                    placeholder={`Option ${oi + 1}`}
                    style={{ ...inputSt, flex: 1, cursor: readOnly ? "default" : undefined }}
                  />
                </div>
              );
            })}
          </div>
          {!readOnly && <p style={{ ...hintSt, marginTop: 12 }}>Select the correct answer</p>}
        </div>
      )}

      {question.type === "true_false" && (
        <div>
          <label style={labelSt}>Correct Answer</label>
          {readOnly
            ? <div style={inputSt}>{question.correct_bool ? "True" : "False"}</div>
            : (
              <StyledSelect value={question.correct_bool ? "true" : "false"} onChange={(v) => onUpdate({ correct_bool: v === "true" })}>
                <option value="">Select correct answer</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </StyledSelect>
            )}
        </div>
      )}

      {question.type === "short_answer" && (
        <div>
          <label style={labelSt}>Sample Answer</label>
          <input type="text" value={question.sample_answer}
            onChange={readOnly ? undefined : (e) => onUpdate({ sample_answer: e.target.value })}
            readOnly={readOnly}
            placeholder="Enter a sample correct answer..."
            style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
          />
          {!readOnly && <p style={{ ...hintSt, marginTop: 8 }}>Used as a reference when grading</p>}
        </div>
      )}
    </div>
  );
}

type TestFormBodyProps = {
  mode: "add" | "edit" | "view";
  initialValues?: Partial<Omit<TestFormValues, "questions">> & { questions?: TestQuestion[] };
  onSave?: (values: TestFormValues) => Promise<void>;
  onCancel: () => void;
};

/** Test form body: all state and fields without a ModalShell, for embedding inside another modal. */
export function TestFormBody({ mode, initialValues = {}, onSave, onCancel }: TestFormBodyProps) {
  const readOnly = mode === "view";
  const [values, setValues] = useState<TestFormValues>({ ...EMPTY, ...initialValues });
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!readOnly) titleRef.current?.focus(); }, [readOnly]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function addQuestion() {
    setValues((prev) => ({ ...prev, questions: [...prev.questions, makeQuestion()] }));
  }

  function removeQuestion(key: string) {
    setValues((prev) => ({ ...prev, questions: prev.questions.filter((q) => q._key !== key) }));
  }

  function updateQuestion(key: string, patch: Partial<TestQuestion>) {
    setValues((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => q._key === key ? { ...q, ...patch } : q),
    }));
  }

  function updateOption(key: string, idx: number, val: string) {
    setValues((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q._key !== key) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[idx] = val;
        return { ...q, options: opts };
      }),
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!values.title.trim()) return;
    const emptyQ = values.questions.findIndex((q) => !q.text.trim());
    if (emptyQ !== -1) {
      setSaveError(`Question ${emptyQ + 1} has no text.`);
      return;
    }
    setSaveError(null);
    setLoading(true);
    try {
      await onSave?.(values);
    } catch (err: unknown) {
      const e = err as { message?: string; fields?: Record<string, string | string[]> };
      const fieldMsg = e.fields
        ? Object.entries(e.fields)
            .filter(([k]) => k !== "status")
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ")
        : null;
      setSaveError(fieldMsg || e?.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <div
        className="grid"
        style={{ gridTemplateColumns: readOnly ? "1fr 1fr" : "1fr 1fr 1fr", gap: "clamp(16px, 2.22vw, 32px)", marginBottom: "clamp(16px, 1.67vw, 24px)" }}
      >
        {!readOnly && (
          <div>
            <label htmlFor="test-title" style={labelSt}>Test Title*</label>
            <input
              ref={titleRef}
              id="test-title"
              name="title"
              type="text"
              value={values.title}
              onChange={handleChange}
              placeholder="New Test"
              required
              style={inputSt}
            />
          </div>
        )}
        <div>
          <label htmlFor="test-passing-score" style={labelSt}>Passing Score</label>
          <input
            id="test-passing-score"
            name="passing_score"
            type={readOnly ? "text" : "number"}
            min="0"
            max="100"
            value={values.passing_score}
            onChange={readOnly ? undefined : handleChange}
            readOnly={readOnly}
            placeholder="3"
            style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
          />
        </div>
        <div>
          <div className="flex items-center" style={{ gap: 4, marginBottom: 12 }}>
            <Clock size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
            <label htmlFor="test-duration" style={{ ...labelSt, marginBottom: 0 }}>Duration (minutes)</label>
          </div>
          <input
            id="test-duration"
            name="duration_minutes"
            type={readOnly ? "text" : "number"}
            min="1"
            value={values.duration_minutes || (readOnly ? "—" : "")}
            onChange={readOnly ? undefined : handleChange}
            readOnly={readOnly}
            placeholder="0"
            style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "clamp(20px, 2.22vw, 32px)" }}>
        <label htmlFor="test-description" style={labelSt}>Test Description</label>
        <textarea
          id="test-description"
          name="description"
          value={values.description}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          placeholder="Text"
          style={{ ...inputSt, minHeight: 57, resize: readOnly ? "none" : "vertical", cursor: readOnly ? "default" : undefined }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: "clamp(12px, 1.39vw, 20px)" }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <HelpCircle size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 1.39vw, 20px)", lineHeight: "25px", color: "var(--color-text-primary)" }}>
              Questions ({values.questions.length})
            </span>
          </div>
          {!readOnly && (
            <button type="button" onClick={addQuestion}
              className="inline-flex items-center justify-center transition hover:opacity-80"
              style={{ gap: 10, minWidth: "clamp(160px, 15.69vw, 226px)", height: "clamp(38px, 3.06vw, 44px)", background: "var(--color-text-primary)", border: "none", borderRadius: 28, fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(14px, 1.39vw, 20px)", color: "var(--color-bg)", cursor: "pointer", padding: "4px 16px" }}>
              <Plus size={24} style={{ color: "var(--color-bg)" }} />
              Add Question
            </button>
          )}
        </div>

        {values.questions.length === 0 ? (
          <div style={{ border: "2px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(24px, 2.78vw, 40px) 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 400, fontSize: "clamp(13px, 1.39vw, 20px)", color: "var(--color-text-secondary)" }}>No questions yet</span>
            {!readOnly && (
              <button type="button" onClick={addQuestion}
                className="inline-flex items-center justify-center transition hover:opacity-80"
                style={{ gap: 10, minWidth: "clamp(200px, 20.49vw, 295px)", height: "clamp(38px, 3.06vw, 44px)", background: "var(--color-bg)", border: "1px solid var(--color-draft)", borderRadius: 28, fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(14px, 1.39vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-primary)", cursor: "pointer", padding: "4px 16px" }}>
                <Plus size={20} />Add First Question
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 20px)" }}>
            {values.questions.map((q, qi) => (
              <QuestionCard
                key={q._key}
                question={q}
                index={qi}
                readOnly={readOnly}
                onRemove={readOnly ? () => {} : () => removeQuestion(q._key)}
                onUpdate={readOnly ? () => {} : (patch) => updateQuestion(q._key, patch)}
                onUpdateOption={readOnly ? () => {} : (idx, val) => updateOption(q._key, idx, val)}
              />
            ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <ModalFooter
          onCancel={onCancel}
          submitLabel="Save Test"
          loading={loading}
          disabled={!values.title.trim() || loading}
          error={saveError}
        />
      )}

    </form>
  );
}

type Props = {
  mode: "add" | "edit" | "view";
  initialValues?: Partial<Omit<TestFormValues, "questions">> & { questions?: TestQuestion[] };
  onClose: () => void;
  onSave?: (values: TestFormValues) => Promise<void>;
  /** CSS z-index for the overlay. Use 60 when rendered inside another modal (default: 50). */
  zIndex?: number;
};

/** Modal for creating, editing, or viewing a course test with inline question management. */
export function TestFormModal({ mode, initialValues = {}, onClose, onSave, zIndex }: Props) {
  const readOnly = mode === "view";
  return (
    <ModalShell
      onClose={onClose}
      title={readOnly ? (initialValues?.title || "Test") : mode === "add" ? "Add Test" : "Edit Test"}
      icon={<ClipboardList size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />}
      width="clamp(480px, 81.39vw, 1200px)"
      padding="clamp(20px, 2.78vw, 40px) clamp(24px, 3.47vw, 50px)"
      zIndex={zIndex}
    >
      <TestFormBody mode={mode} initialValues={initialValues} onSave={onSave} onCancel={onClose} />
    </ModalShell>
  );
}
