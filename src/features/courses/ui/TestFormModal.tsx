"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ClipboardList, Clock, HelpCircle, Plus, Trash2 } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";

export type TestQuestion = {
  _key: string;
  id?: number;
  type: string;
  text: string;
  options: [string, string, string, string];
  correct_indices: number[];
  exact_set_match: boolean;
  correct_bool: boolean;
  sample_answer: string;
  accepted_answers: string[];
};

export type TestFormValues = {
  title: string;
  passing_score: string;
  duration_minutes: string;
  description: string;
  allow_retakes: boolean;
  max_attempts: string;
  questions: TestQuestion[];
};

const EMPTY: TestFormValues = {
  title: "",
  passing_score: "70",
  duration_minutes: "",
  description: "",
  allow_retakes: false,
  max_attempts: "",
  questions: [],
};

function makeQuestion(): TestQuestion {
  return {
    _key: Math.random().toString(36).slice(2),
    type: "single_choice",
    text: "",
    options: ["", "", "", ""],
    correct_indices: [0],
    exact_set_match: true,
    correct_bool: true,
    sample_answer: "",
    accepted_answers: [],
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
  const t = useTranslations("TestFormModal");
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
          {t("questionNumber", { order: index + 1 })}
        </span>
        {!readOnly && (
          <button type="button" onClick={onRemove}
            className="flex items-center justify-center rounded-full transition hover:bg-red-50"
            style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
            aria-label={t("removeQuestion")}>
            <Trash2 size={18} style={{ color: "var(--color-text-primary)" }} />
          </button>
        )}
      </div>

      <div>
        <label style={labelSt}>{t("questionType")}</label>
        {readOnly
          ? <div style={inputSt}>{t(`questionTypeOption.${question.type}`)}</div>
          : (
            <StyledSelect value={question.type} onChange={(v) => onUpdate({ type: v })}>
              <option value="single_choice">{t("questionTypeOption.single_choice")}</option>
              <option value="multiple_choice">{t("questionTypeOption.multiple_choice")}</option>
              <option value="true_false">{t("questionTypeOption.true_false")}</option>
              <option value="short_answer">{t("questionTypeOption.short_answer")}</option>
            </StyledSelect>
          )}
      </div>

      <div>
        <label style={labelSt}>{t("questionText")}</label>
        <input type="text" value={question.text}
          onChange={readOnly ? undefined : (e) => onUpdate({ text: e.target.value })}
          readOnly={readOnly}
          placeholder={t("questionTextPlaceholder")}
          style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
        />
      </div>

      {(question.type === "single_choice" || question.type === "multiple_choice") && (
        <div>
          <label style={labelSt}>{t("answerOptions")}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {question.options.map((opt, oi) => {
              const isSingle = question.type === "single_choice";
              const isCorrect = question.correct_indices.includes(oi);
              const toggleCorrect = () =>
                onUpdate({
                  correct_indices: isSingle
                    ? [oi]
                    : isCorrect
                      ? question.correct_indices.filter((i) => i !== oi)
                      : [...question.correct_indices, oi],
                });
              return (
                <div key={oi} className="flex items-center" style={{ gap: 12 }}>
                  <div style={{ flexShrink: 0, width: 20, height: 20, border: "1px solid var(--color-blue)", borderRadius: isSingle ? "50%" : 2, background: isCorrect ? "var(--color-catalog-category-active)" : "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: readOnly ? "default" : "pointer" }}
                    onClick={readOnly ? undefined : toggleCorrect}
                    role={readOnly ? undefined : "button"}
                    aria-label={readOnly ? undefined : t("markOptionCorrect", { order: oi + 1 })}>
                    {isCorrect && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="var(--color-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <input type="text" value={opt}
                    onChange={readOnly ? undefined : (e) => onUpdateOption(oi, e.target.value)}
                    readOnly={readOnly}
                    placeholder={t("optionPlaceholder", { order: oi + 1 })}
                    style={{ ...inputSt, flex: 1, cursor: readOnly ? "default" : undefined }}
                  />
                </div>
              );
            })}
          </div>
          {!readOnly && (
            <p style={{ ...hintSt, marginTop: 12 }}>
              {question.type === "single_choice" ? t("selectOneCorrect") : t("selectAllCorrect")}
            </p>
          )}
          {!readOnly && question.type === "multiple_choice" && (
            <label className="flex items-center" style={{ gap: 8, marginTop: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={question.exact_set_match}
                onChange={(e) => onUpdate({ exact_set_match: e.target.checked })} />
              <span style={{ ...hintSt, marginTop: 0 }}>{t("requireExactMatch")}</span>
            </label>
          )}
        </div>
      )}

      {question.type === "true_false" && (
        <div>
          <label style={labelSt}>{t("correctAnswer")}</label>
          {readOnly
            ? <div style={inputSt}>{question.correct_bool ? t("true") : t("false")}</div>
            : (
              <StyledSelect value={question.correct_bool ? "true" : "false"} onChange={(v) => onUpdate({ correct_bool: v === "true" })}>
                <option value="">{t("selectCorrectAnswer")}</option>
                <option value="true">{t("true")}</option>
                <option value="false">{t("false")}</option>
              </StyledSelect>
            )}
        </div>
      )}

      {question.type === "short_answer" && (
        <div>
          <label style={labelSt}>{t("sampleAnswerLabel")}</label>
          <input type="text" value={question.sample_answer}
            onChange={readOnly ? undefined : (e) => onUpdate({ sample_answer: e.target.value })}
            readOnly={readOnly}
            placeholder={t("sampleAnswerPlaceholder")}
            style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
          />
          {!readOnly && <p style={{ ...hintSt, marginTop: 8 }}>{t("sampleAnswerHint")}</p>}
          <label style={{ ...labelSt, marginTop: 16 }}>{t("otherAcceptedAnswers")}</label>
          <input type="text" value={question.accepted_answers.join(", ")}
            onChange={readOnly ? undefined : (e) => onUpdate({ accepted_answers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            readOnly={readOnly}
            placeholder={t("otherAcceptedAnswersPlaceholder")}
            style={{ ...inputSt, cursor: readOnly ? "default" : undefined }}
          />
          {!readOnly && <p style={{ ...hintSt, marginTop: 8 }}>{t("otherAcceptedAnswersHint")}</p>}
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
  const t = useTranslations("TestFormModal");
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
      setSaveError(t("questionMissingText", { order: emptyQ + 1 }));
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
      setSaveError(fieldMsg || e?.message || t("errorSave"));
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
            <label htmlFor="test-title" style={labelSt}>{t("testTitle")}</label>
            <input
              ref={titleRef}
              id="test-title"
              name="title"
              type="text"
              value={values.title}
              onChange={handleChange}
              placeholder={t("newTestPlaceholder")}
              required
              style={inputSt}
            />
          </div>
        )}
        <div>
          <label htmlFor="test-passing-score" style={labelSt}>{t("passingScore")}</label>
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
            <label htmlFor="test-duration" style={{ ...labelSt, marginBottom: 0 }}>{t("durationMinutesLabel")}</label>
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
        <label htmlFor="test-description" style={labelSt}>{t("testDescription")}</label>
        <textarea
          id="test-description"
          name="description"
          value={values.description}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          placeholder={t("textPlaceholder")}
          style={{ ...inputSt, minHeight: 57, resize: readOnly ? "none" : "vertical", cursor: readOnly ? "default" : undefined }}
        />
      </div>

      <div style={{ marginBottom: "clamp(20px, 2.22vw, 32px)" }}>
        <label className="flex items-center" style={{ gap: 8, cursor: readOnly ? "default" : "pointer", marginBottom: values.allow_retakes ? 12 : 0 }}>
          <input type="checkbox" checked={values.allow_retakes} disabled={readOnly}
            onChange={(e) => setValues((prev) => ({ ...prev, allow_retakes: e.target.checked }))} />
          <span style={{ ...labelSt, marginBottom: 0 }}>{t("allowRetakes")}</span>
        </label>
        {values.allow_retakes && (
          <div style={{ maxWidth: 280 }}>
            <label htmlFor="test-max-attempts" style={labelSt}>{t("maxAttempts")}</label>
            <input id="test-max-attempts" name="max_attempts" type={readOnly ? "text" : "number"} min="1"
              value={values.max_attempts || (readOnly ? t("unlimited") : "")}
              onChange={readOnly ? undefined : handleChange} readOnly={readOnly}
              placeholder={t("unlimited")} style={{ ...inputSt, cursor: readOnly ? "default" : undefined }} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: "clamp(12px, 1.39vw, 20px)" }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <HelpCircle size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 700, fontSize: "clamp(14px, 1.39vw, 20px)", lineHeight: "25px", color: "var(--color-text-primary)" }}>
              {t("questionsCount", { count: values.questions.length })}
            </span>
          </div>
          {!readOnly && (
            <button type="button" onClick={addQuestion}
              className="inline-flex items-center justify-center transition hover:opacity-80"
              style={{ gap: 10, minWidth: "clamp(160px, 15.69vw, 226px)", height: "clamp(38px, 3.06vw, 44px)", background: "var(--color-text-primary)", border: "none", borderRadius: 28, fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(14px, 1.39vw, 20px)", color: "var(--color-bg)", cursor: "pointer", padding: "4px 16px" }}>
              <Plus size={24} style={{ color: "var(--color-bg)" }} />
              {t("addQuestion")}
            </button>
          )}
        </div>

        {values.questions.length === 0 ? (
          <div style={{ border: "2px solid var(--color-border-light)", borderRadius: 16, padding: "clamp(24px, 2.78vw, 40px) 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-base)", fontWeight: 400, fontSize: "clamp(13px, 1.39vw, 20px)", color: "var(--color-text-secondary)" }}>{t("noQuestionsYet")}</span>
            {!readOnly && (
              <button type="button" onClick={addQuestion}
                className="inline-flex items-center justify-center transition hover:opacity-80"
                style={{ gap: 10, minWidth: "clamp(200px, 20.49vw, 295px)", height: "clamp(38px, 3.06vw, 44px)", background: "var(--color-bg)", border: "1px solid var(--color-draft)", borderRadius: 28, fontFamily: "var(--font-accent)", fontWeight: 500, fontSize: "clamp(14px, 1.39vw, 20px)", letterSpacing: "-0.011em", color: "var(--color-text-primary)", cursor: "pointer", padding: "4px 16px" }}>
                <Plus size={20} />{t("addFirstQuestion")}
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
          submitLabel={t("saveTest")}
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
  const t = useTranslations("TestFormModal");
  const readOnly = mode === "view";
  return (
    <ModalShell
      onClose={onClose}
      title={readOnly ? (initialValues?.title || t("testFallbackTitle")) : mode === "add" ? t("addTest") : t("editTest")}
      icon={<ClipboardList size={20} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />}
      width="clamp(480px, 81.39vw, 1200px)"
      padding="clamp(20px, 2.78vw, 40px) clamp(24px, 3.47vw, 50px)"
      zIndex={zIndex}
    >
      <TestFormBody mode={mode} initialValues={initialValues} onSave={onSave} onCancel={onClose} />
    </ModalShell>
  );
}
