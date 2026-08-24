"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock,
  Play,
  Upload,
  FileText,
  X,
  ClipboardList,
  ChevronUp,
  ChevronDown,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { sanitizeCourseHtml } from "@/shared/lib/sanitizeCourseHtml";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import {
  createLessonItem,
  updateLessonItem,
  deleteLessonItem,
  reorderLessonItems,
  createTest,
  updateTest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/entities/course";
import type { LessonDocument, LessonItem, LessonItemType } from "@/entities/course";
import { TestFormBody } from "./TestFormModal";
import type { TestFormValues, TestQuestion } from "./TestFormModal";

export type LessonFormValues = {
  title: string;
  duration_minutes: string;
  min_score: string;
  is_mandatory: boolean;
  existing_documents?: LessonDocument[];
  new_documents: File[];
  deleted_document_ids: number[];
  items?: LessonItem[];
};

const EMPTY: LessonFormValues = {
  title: "",
  duration_minutes: "",
  min_score: "70",
  is_mandatory: false,
  existing_documents: [],
  new_documents: [],
  deleted_document_ids: [],
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

type TestPanelConfig =
  | { mode: "create"; onSave: (values: TestFormValues) => Promise<void> }
  | {
      mode: "edit";
      initialValues: Partial<Omit<TestFormValues, "questions">> & { questions?: TestQuestion[] };
      onSave: (values: TestFormValues) => Promise<void>;
    };

const TYPE_ICON: Record<LessonItemType, React.ReactNode> = {
  text: <FileText size={15} />,
  video: <Play size={15} />,
  test: <ClipboardList size={15} />,
};

/** Plain-text rendition of a text block's body_html, for the one-line list preview. */
function textPreview(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ItemEditForm({
  item,
  onSaveText,
  onSaveVideo,
  onCancel,
}: {
  item: LessonItem;
  onSaveText: (bodyHtml: string, durationMinutes?: number | null) => Promise<void>;
  onSaveVideo: (data: {
    video?: File | null;
    video_url?: string;
    duration_minutes?: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("LessonFormModal");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [bodyHtml, setBodyHtml] = useState(item.body_html ?? "");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(item.video_url ?? "");
  const [duration, setDuration] = useState(
    item.duration_minutes != null ? String(item.duration_minutes) : "",
  );

  async function save() {
    setSaving(true);
    try {
      if (item.item_type === "text") {
        await onSaveText(bodyHtml, duration ? parseInt(duration, 10) : null);
      } else {
        await onSaveVideo({
          video: videoFile,
          video_url: videoUrl.trim() || undefined,
          duration_minutes: duration ? parseInt(duration, 10) : null,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      {item.item_type === "text" && (
        <>
          <RichTextEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            placeholder={t("writeTextPlaceholder")}
          />
          <div className="flex items-center" style={{ gap: 6 }}>
            <Clock size={14} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={t("durationMinPlaceholder")}
              style={{ ...inputSt, fontSize: 14, padding: "8px 12px", maxWidth: 160 }}
            />
          </div>
        </>
      )}
      {item.item_type === "video" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center transition hover:opacity-80"
            style={{
              gap: 8,
              padding: "8px 14px",
              background: "var(--color-input-bg)",
              border: "none",
              borderRadius: 10,
              fontFamily: "var(--font-base)",
              fontSize: 14,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            <Upload size={15} />
            {videoFile ? videoFile.name : t("chooseVideoFile")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          />
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={t("pasteVideoUrlPlaceholder")}
            style={{ ...inputSt, fontSize: 14, padding: "10px 14px" }}
          />
          <div className="flex items-center" style={{ gap: 6 }}>
            <Clock size={14} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={t("durationMinPlaceholder")}
              style={{ ...inputSt, fontSize: 14, padding: "8px 12px", maxWidth: 160 }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center" style={{ gap: 8, marginTop: 2 }}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center transition hover:opacity-80 disabled:opacity-50"
          style={{
            padding: "7px 18px",
            background: "var(--color-text-primary)",
            border: "none",
            borderRadius: 20,
            fontFamily: "var(--font-accent)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--color-bg)",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="transition hover:opacity-70"
          style={{
            padding: "7px 14px",
            background: "none",
            border: "none",
            fontFamily: "var(--font-base)",
            fontSize: 13,
            color: "var(--color-text-secondary)",
            cursor: "pointer",
          }}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

function buildQuestionPayload(q: TestQuestion) {
  const isChoice = q.type === "single_choice" || q.type === "multiple_choice";
  return {
    question_type: q.type,
    text: q.text,
    options: isChoice ? q.options : undefined,
    correct_indices: isChoice ? q.correct_indices : undefined,
    exact_set_match: q.type === "multiple_choice" ? q.exact_set_match : undefined,
    correct_bool: q.type === "true_false" ? q.correct_bool : undefined,
    sample_answer: q.type === "short_answer" ? q.sample_answer : undefined,
    accepted_answers: q.type === "short_answer" ? q.accepted_answers : undefined,
  };
}

function ContentBlocksEditor({
  readOnly,
  courseSlug,
  moduleId,
  lessonId,
  initialItems,
  onItemsChange,
  onOpenTestPanel,
}: {
  readOnly: boolean;
  courseSlug: string;
  moduleId: number;
  lessonId: number;
  initialItems: LessonItem[];
  onItemsChange?: (items: LessonItem[]) => void;
  onOpenTestPanel: (config: TestPanelConfig) => void;
}) {
  const t = useTranslations("LessonFormModal");
  const [items, setItems] = useState<LessonItem[]>(initialItems);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function moveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    const reordered = await reorderLessonItems(
      courseSlug,
      moduleId,
      lessonId,
      next.map((it) => it.id),
    );
    setItems(reordered);
    onItemsChange?.(reordered);
  }

  async function handleSaveText(itemId: number, bodyHtml: string, durationMinutes?: number | null) {
    const payload: { body_html: string; duration_minutes?: number } = { body_html: bodyHtml };
    if (durationMinutes != null && !isNaN(durationMinutes))
      payload.duration_minutes = durationMinutes;
    const updated = await updateLessonItem(courseSlug, moduleId, lessonId, itemId, payload);
    const next = items.map((it) => (it.id === itemId ? updated : it));
    setItems(next);
    onItemsChange?.(next);
    setEditingId(null);
  }

  async function handleSaveVideo(
    itemId: number,
    data: { video?: File | null; video_url?: string; duration_minutes?: number | null },
  ) {
    const updated = await updateLessonItem(courseSlug, moduleId, lessonId, itemId, data);
    const next = items.map((it) => (it.id === itemId ? updated : it));
    setItems(next);
    onItemsChange?.(next);
    setEditingId(null);
  }

  async function handleDelete(itemId: number) {
    await deleteLessonItem(courseSlug, moduleId, lessonId, itemId);
    const next = items.filter((it) => it.id !== itemId);
    setItems(next);
    onItemsChange?.(next);
    if (editingId === itemId) setEditingId(null);
  }

  async function addText() {
    const item = await createLessonItem(courseSlug, moduleId, lessonId, {
      item_type: "text",
      body_html: "",
    });
    const next = [...items, item];
    setItems(next);
    onItemsChange?.(next);
    setEditingId(item.id);
  }

  async function addVideo() {
    const item = await createLessonItem(courseSlug, moduleId, lessonId, { item_type: "video" });
    const next = [...items, item];
    setItems(next);
    onItemsChange?.(next);
    setEditingId(item.id);
  }

  async function handleTestCreate(values: TestFormValues) {
    const test = await createTest(courseSlug, moduleId, {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      passing_score: values.passing_score ? parseInt(values.passing_score, 10) : 70,
      allow_retakes: values.allow_retakes,
      max_attempts:
        values.allow_retakes && values.max_attempts ? parseInt(values.max_attempts, 10) : null,
    });
    const questions = await Promise.all(
      values.questions.map((q) =>
        createQuestion(courseSlug, moduleId, test.id, buildQuestionPayload(q)),
      ),
    );
    const durMin = values.duration_minutes ? parseInt(values.duration_minutes, 10) : undefined;
    const item = await createLessonItem(courseSlug, moduleId, lessonId, {
      item_type: "test",
      test: test.id,
      ...(durMin ? { duration_minutes: durMin } : {}),
    });
    const next = [...items, { ...item, test: { ...test, questions } }];
    setItems(next);
    onItemsChange?.(next);
  }

  async function handleTestUpdate(itemId: number, values: TestFormValues) {
    const sourceItem = items.find((it) => it.id === itemId);
    if (!sourceItem?.test) return;
    const testId = sourceItem.test.id;
    const durMin = values.duration_minutes ? parseInt(values.duration_minutes, 10) : null;
    const updatedTest = await updateTest(courseSlug, moduleId, testId, {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      passing_score: values.passing_score ? parseInt(values.passing_score, 10) : undefined,
      allow_retakes: values.allow_retakes,
      max_attempts:
        values.allow_retakes && values.max_attempts ? parseInt(values.max_attempts, 10) : null,
    });
    if (durMin != null && !isNaN(durMin)) {
      await updateLessonItem(courseSlug, moduleId, lessonId, itemId, { duration_minutes: durMin });
    }
    const originalIds = new Set(sourceItem.test.questions.map((q) => q.id));
    const keptIds = new Set(values.questions.map((q) => q.id).filter(Boolean) as number[]);
    for (const id of originalIds) {
      if (!keptIds.has(id)) await deleteQuestion(courseSlug, moduleId, testId, id);
    }
    const savedQuestions = await Promise.all(
      values.questions.map((q) =>
        q.id
          ? updateQuestion(courseSlug, moduleId, testId, q.id, buildQuestionPayload(q))
          : createQuestion(courseSlug, moduleId, testId, buildQuestionPayload(q)),
      ),
    );
    const next = items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            ...(durMin != null && !isNaN(durMin) ? { duration_minutes: durMin } : {}),
            test: { ...updatedTest, questions: savedQuestions },
          }
        : it,
    );
    setItems(next);
    onItemsChange?.(next);
  }

  const addBtnSt: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    height: 34,
    background: "var(--color-bg)",
    border: "1px solid var(--color-draft)",
    borderRadius: 20,
    fontFamily: "var(--font-accent)",
    fontWeight: 500,
    fontSize: "clamp(12px, 0.97vw, 14px)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  };

  return (
    <div>
      <label style={labelSt}>{t("contentBlocks")}</label>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && (
          <div
            style={{
              padding: "20px 16px",
              border: "2px dashed var(--color-border-light)",
              borderRadius: 12,
              textAlign: "center",
              fontFamily: "var(--font-base)",
              fontSize: 14,
              color: "var(--color-text-secondary)",
            }}
          >
            {readOnly ? t("noContentBlocks") : t("addBlocksHint")}
          </div>
        )}

        {items.map((item, index) => {
          const typeLabel = t(`type.${item.item_type}`);
          const preview =
            item.item_type === "text"
              ? textPreview(item.body_html ?? "").slice(0, 90) || t("emptyPreview")
              : item.item_type === "video"
                ? (item.original_video_name ?? item.video_url ?? t("type.video"))
                : (item.test?.title ?? t("type.test"));

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--color-border-light)",
                borderRadius: 12,
                padding: "10px 14px",
                background: "var(--color-bg)",
              }}
            >
              <div className="flex items-center justify-between" style={{ gap: 8 }}>
                <div className="flex min-w-0 items-center" style={{ gap: 8 }}>
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: "var(--color-input-bg)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {TYPE_ICON[item.item_type]}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-base)",
                      fontWeight: 600,
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}. {typeLabel.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-base)",
                      fontSize: 14,
                      color: "var(--color-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {preview}
                  </span>
                  {item.duration_minutes != null && (
                    <span
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        flexShrink: 0,
                        marginLeft: "auto",
                      }}
                    >
                      {t("durationMinutes", { count: item.duration_minutes })}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center" style={{ gap: 2 }}>
                  {readOnly ? (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      aria-label={expandedId === item.id ? t("collapse") : t("previewContent")}
                      className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
                      style={{
                        width: 28,
                        height: 28,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {expandedId === item.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        aria-label={t("moveUp")}
                        className="flex items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30"
                        style={{
                          width: 28,
                          height: 28,
                          border: "none",
                          background: "none",
                          cursor: index === 0 ? "default" : "pointer",
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveUp(index + 1)}
                        disabled={index === items.length - 1}
                        aria-label={t("moveDown")}
                        className="flex items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30"
                        style={{
                          width: 28,
                          height: 28,
                          border: "none",
                          background: "none",
                          cursor: index === items.length - 1 ? "default" : "pointer",
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {item.item_type === "test" ? (
                        <button
                          type="button"
                          aria-label={t("editTest")}
                          className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
                          style={{
                            width: 28,
                            height: 28,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const testData = item.test!;
                            onOpenTestPanel({
                              mode: "edit",
                              initialValues: {
                                title: testData.title,
                                description: testData.description ?? "",
                                passing_score: String(testData.passing_score ?? 70),
                                duration_minutes:
                                  item.duration_minutes != null
                                    ? String(item.duration_minutes)
                                    : "",
                                allow_retakes: testData.allow_retakes ?? false,
                                max_attempts:
                                  testData.max_attempts != null
                                    ? String(testData.max_attempts)
                                    : "",
                                questions: (testData.questions ?? []).map((q) => ({
                                  _key: String(q.id),
                                  id: q.id,
                                  type: q.question_type,
                                  text: q.text,
                                  options: (q.options?.length >= 4
                                    ? q.options.slice(0, 4)
                                    : [...(q.options ?? []), "", "", "", ""].slice(0, 4)) as [
                                    string,
                                    string,
                                    string,
                                    string,
                                  ],
                                  correct_indices: q.correct_indices ?? [],
                                  exact_set_match: q.exact_set_match ?? true,
                                  correct_bool: q.correct_bool ?? true,
                                  sample_answer: q.sample_answer ?? "",
                                  accepted_answers: q.accepted_answers ?? [],
                                })),
                              },
                              onSave: (values) => handleTestUpdate(item.id, values),
                            });
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icons/edit.svg" alt="" width={14} height={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                          aria-label={t("editBlock")}
                          className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
                          style={{
                            width: 28,
                            height: 28,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icons/edit.svg" alt="" width={14} height={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label={t("deleteBlock")}
                        className="flex items-center justify-center rounded-full transition hover:bg-red-50"
                        style={{
                          width: 28,
                          height: 28,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} style={{ color: "var(--color-text-secondary)" }} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {readOnly && expandedId === item.id && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid var(--color-border-light)",
                  }}
                >
                  {item.item_type === "text" &&
                    (item.body_html ? (
                      <div
                        style={{
                          fontFamily: "var(--font-base)",
                          fontSize: 14,
                          lineHeight: "22px",
                          color: "var(--color-text-primary)",
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeCourseHtml(item.body_html) }}
                      />
                    ) : (
                      <p
                        style={{
                          fontFamily: "var(--font-base)",
                          fontSize: 14,
                          color: "var(--color-text-secondary)",
                          margin: 0,
                        }}
                      >
                        {t("noContent")}
                      </p>
                    ))}

                  {item.item_type === "video" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {item.video_url ? (
                        <video
                          src={item.video_url}
                          controls
                          style={{
                            width: "100%",
                            maxHeight: 280,
                            borderRadius: 8,
                            background: "var(--color-black)",
                          }}
                        />
                      ) : (
                        <p
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: 13,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {t("noVideoUploaded")}
                        </p>
                      )}
                      {item.duration_minutes != null && (
                        <div className="flex items-center" style={{ gap: 5 }}>
                          <Clock size={13} style={{ color: "var(--color-text-secondary)" }} />
                          <span
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: 13,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {t("durationLabel", { count: item.duration_minutes })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {item.item_type === "test" && item.test && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {item.test.description && (
                        <p
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: 13,
                            color: "var(--color-text-secondary)",
                            margin: 0,
                          }}
                        >
                          {item.test.description}
                        </p>
                      )}
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <ClipboardList size={13} style={{ color: "var(--color-text-secondary)" }} />
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: 13,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {t("passAndQuestions", {
                            passing: item.test.passing_score ?? 70,
                            count: item.test.questions?.length ?? 0,
                          })}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {(item.test.questions ?? []).map((q, qi) => (
                          <div
                            key={q.id}
                            style={{
                              padding: "10px 12px",
                              background: "var(--color-input-bg)",
                              borderRadius: 10,
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "var(--font-base)",
                                fontWeight: 600,
                                fontSize: 13,
                                color: "var(--color-text-primary)",
                                margin: "0 0 8px 0",
                              }}
                            >
                              {qi + 1}. {q.text}
                            </p>
                            {(q.question_type === "multiple_choice" ||
                              q.question_type === "single_choice") && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {q.options.map((opt, oi) => {
                                  const correct = q.correct_indices?.includes(oi) ?? false;
                                  return (
                                    <div key={oi} className="flex items-center" style={{ gap: 6 }}>
                                      {correct ? (
                                        <CheckCircle2
                                          size={13}
                                          style={{ color: "var(--color-success)", flexShrink: 0 }}
                                        />
                                      ) : (
                                        <MinusCircle
                                          size={13}
                                          style={{
                                            color: "var(--color-text-secondary)",
                                            flexShrink: 0,
                                            opacity: 0.4,
                                          }}
                                        />
                                      )}
                                      <span
                                        style={{
                                          fontFamily: "var(--font-base)",
                                          fontSize: 13,
                                          color: correct
                                            ? "var(--color-success)"
                                            : "var(--color-text-primary)",
                                          fontWeight: correct ? 600 : 400,
                                        }}
                                      >
                                        {opt}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {q.question_type === "true_false" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {([true, false] as const).map((boolValue) => {
                                  const correct = boolValue === q.correct_bool;
                                  return (
                                    <div
                                      key={String(boolValue)}
                                      className="flex items-center"
                                      style={{ gap: 6 }}
                                    >
                                      {correct ? (
                                        <CheckCircle2
                                          size={13}
                                          style={{ color: "var(--color-success)", flexShrink: 0 }}
                                        />
                                      ) : (
                                        <XCircle
                                          size={13}
                                          style={{
                                            color: "var(--color-text-secondary)",
                                            flexShrink: 0,
                                            opacity: 0.4,
                                          }}
                                        />
                                      )}
                                      <span
                                        style={{
                                          fontFamily: "var(--font-base)",
                                          fontSize: 13,
                                          color: correct
                                            ? "var(--color-success)"
                                            : "var(--color-text-primary)",
                                          fontWeight: correct ? 600 : 400,
                                        }}
                                      >
                                        {boolValue ? t("true") : t("false")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {q.question_type === "short_answer" && q.sample_answer && (
                              <p
                                style={{
                                  fontFamily: "var(--font-base)",
                                  fontSize: 13,
                                  color: "var(--color-text-secondary)",
                                  margin: 0,
                                }}
                              >
                                {t("sampleAnswer", { value: q.sample_answer })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!readOnly && editingId === item.id && item.item_type !== "test" && (
                <ItemEditForm
                  item={item}
                  onSaveText={(content, durationMinutes) =>
                    handleSaveText(item.id, content, durationMinutes)
                  }
                  onSaveVideo={(data) => handleSaveVideo(item.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center" style={{ marginTop: 10, gap: 6 }}>
          <button
            type="button"
            onClick={addText}
            className="transition hover:opacity-80"
            style={addBtnSt}
          >
            <Plus size={13} /> <FileText size={13} /> {t("type.text")}
          </button>
          <button
            type="button"
            onClick={addVideo}
            className="transition hover:opacity-80"
            style={addBtnSt}
          >
            <Plus size={13} /> <Play size={13} /> {t("type.video")}
          </button>
          <button
            type="button"
            className="transition hover:opacity-80"
            style={addBtnSt}
            onClick={() => onOpenTestPanel({ mode: "create", onSave: handleTestCreate })}
          >
            <Plus size={13} /> <ClipboardList size={13} /> {t("type.test")}
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  mode: "add" | "edit" | "view";
  initialValues?: Partial<LessonFormValues>;
  onClose: () => void;
  onSave?: (values: LessonFormValues) => Promise<void>;
  courseSlug?: string;
  moduleId?: number;
  lessonId?: number;
  onItemsChange?: (items: LessonItem[]) => void;
  /** When true (editing a published course's pending changes), additional materials
   *  can't be managed here — they're edited directly on the live course instead. */
  hideDocuments?: boolean;
};

/** Modal dialog for creating, editing, or viewing a course lesson, including its content blocks. */
export function LessonFormModal({
  mode,
  initialValues = {},
  onClose,
  onSave,
  courseSlug,
  moduleId,
  lessonId,
  onItemsChange,
  hideDocuments,
}: Props) {
  const t = useTranslations("LessonFormModal");
  const readOnly = mode === "view";
  const showItems =
    (mode === "edit" || mode === "view") && !!courseSlug && !!moduleId && !!lessonId;

  const [values, setValues] = useState<LessonFormValues>({ ...EMPTY, ...initialValues });
  const [loading, setLoading] = useState(false);
  const [testPanel, setTestPanel] = useState<TestPanelConfig | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!readOnly && !testPanel) titleRef.current?.focus();
  }, [readOnly, testPanel]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.title.trim() || !onSave) return;
    setLoading(true);
    try {
      await onSave(values);
    } finally {
      setLoading(false);
    }
  }

  const modalTitle = testPanel
    ? testPanel.mode === "create"
      ? t("addTest")
      : t("editTest")
    : mode === "add"
      ? t("addLesson")
      : mode === "view"
        ? values.title || t("lesson")
        : t("editLesson");

  const modalIcon = testPanel ? (
    <ClipboardList size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
  ) : (
    <Play size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
  );

  const modalOnClose = testPanel ? () => setTestPanel(null) : onClose;

  return (
    <ModalShell
      onClose={modalOnClose}
      title={modalTitle}
      icon={modalIcon}
      width="clamp(480px, 81.39vw, 1200px)"
      padding="clamp(20px, 2.78vw, 40px) clamp(24px, 3.47vw, 50px)"
    >
      {testPanel && (
        <TestFormBody
          mode={testPanel.mode === "create" ? "add" : "edit"}
          initialValues={testPanel.mode === "edit" ? testPanel.initialValues : undefined}
          onSave={async (v) => {
            await testPanel.onSave(v);
            setTestPanel(null);
          }}
          onCancel={() => setTestPanel(null)}
        />
      )}

      {/* Lesson form: kept mounted so ContentBlocksEditor preserves its items state */}
      <form onSubmit={handleSubmit} style={{ display: testPanel ? "none" : undefined }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 20px)" }}>
          {!readOnly && (
            <div>
              <label htmlFor="lesson-title" style={labelSt}>
                {t("lessonTitle")}
              </label>
              <input
                ref={titleRef}
                id="lesson-title"
                name="title"
                type="text"
                value={values.title}
                onChange={handleChange}
                placeholder={t("textPlaceholder")}
                required
                style={inputSt}
              />
            </div>
          )}

          {showItems && (
            <ContentBlocksEditor
              readOnly={readOnly}
              courseSlug={courseSlug!}
              moduleId={moduleId!}
              lessonId={lessonId!}
              initialItems={values.items ?? []}
              onItemsChange={(items) => {
                const total = items.reduce((sum, i) => sum + (i.duration_minutes ?? 0), 0);
                setValues((prev) => ({
                  ...prev,
                  duration_minutes: total > 0 ? String(total) : "",
                }));
                onItemsChange?.(items);
              }}
              onOpenTestPanel={setTestPanel}
            />
          )}

          <div>
            <label style={labelSt}>{t("documents")}</label>
            {hideDocuments ? (
              <p style={{ ...hintSt, marginTop: 0 }}>
                {t.rich("hideDocumentsHint", { strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
            ) : (
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
                {(values.existing_documents ?? [])
                  .filter((d) => !values.deleted_document_ids.includes(d.id))
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between"
                      style={{ gap: 8 }}
                    >
                      <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                        <FileText
                          size={18}
                          style={{ flexShrink: 0, color: "var(--color-text-secondary)" }}
                        />
                        {readOnly ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: "clamp(13px, 1.04vw, 16px)",
                              color: "var(--color-blue)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {doc.original_name}
                          </a>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-base)",
                              fontSize: "clamp(13px, 1.04vw, 16px)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {doc.original_name}
                          </span>
                        )}
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            setValues((p) => ({
                              ...p,
                              deleted_document_ids: [...p.deleted_document_ids, doc.id],
                            }))
                          }
                          className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-red-50"
                          style={{
                            width: 28,
                            height: 28,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                          aria-label={t("removeDocument")}
                        >
                          <X size={16} style={{ color: "var(--color-text-secondary)" }} />
                        </button>
                      )}
                    </div>
                  ))}
                {!readOnly &&
                  values.new_documents.map((file, i) => (
                    <div key={i} className="flex items-center justify-between" style={{ gap: 8 }}>
                      <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                        <FileText
                          size={18}
                          style={{ flexShrink: 0, color: "var(--color-text-secondary)" }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-base)",
                            fontSize: "clamp(13px, 1.04vw, 16px)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setValues((p) => ({
                            ...p,
                            new_documents: p.new_documents.filter((_, j) => j !== i),
                          }))
                        }
                        className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-red-50"
                        style={{
                          width: 28,
                          height: 28,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        aria-label={t("removeFile")}
                      >
                        <X size={16} style={{ color: "var(--color-text-secondary)" }} />
                      </button>
                    </div>
                  ))}
                {!readOnly && (
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
                    {t("addDocuments")}
                  </button>
                )}
                {!readOnly && (
                  <input
                    ref={docInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setValues((p) => ({ ...p, new_documents: [...p.new_documents, ...files] }));
                      e.target.value = "";
                    }}
                  />
                )}
              </div>
            )}
            {!hideDocuments && !readOnly && <p style={hintSt}>{t("documentsHint")}</p>}
          </div>

          <div className="grid grid-cols-2" style={{ gap: "clamp(16px, 2.78vw, 40px)" }}>
            <div>
              <div
                className="flex items-center"
                style={{ gap: 4, marginBottom: "clamp(8px, 0.83vw, 12px)" }}
              >
                <Clock size={24} style={{ color: "var(--color-text-primary)", flexShrink: 0 }} />
                <label htmlFor="lesson-duration" style={{ ...labelSt, marginBottom: 0 }}>
                  {t("durationMinutesLabel")}
                </label>
              </div>
              <input
                id="lesson-duration"
                name="duration_minutes"
                type={readOnly ? "text" : "number"}
                min="1"
                value={values.duration_minutes || (readOnly ? "—" : "")}
                onChange={readOnly ? undefined : handleChange}
                readOnly={readOnly}
                placeholder="0"
                style={{
                  ...inputSt,
                  padding: "clamp(10px, 0.83vw, 12px) clamp(16px, 1.39vw, 20px)",
                  cursor: readOnly ? "default" : undefined,
                }}
              />
            </div>
            <div>
              <label htmlFor="lesson-min-score" style={labelSt}>
                {t("minimumScoreLabel")}
              </label>
              <input
                id="lesson-min-score"
                name="min_score"
                type={readOnly ? "text" : "number"}
                min="0"
                max="100"
                value={values.min_score || (readOnly ? "—" : "")}
                onChange={readOnly ? undefined : handleChange}
                readOnly={readOnly}
                placeholder="3"
                style={{
                  ...inputSt,
                  padding: "clamp(10px, 0.83vw, 12px) clamp(16px, 1.39vw, 20px)",
                  cursor: readOnly ? "default" : undefined,
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="flex items-center"
              style={{ gap: 8, cursor: readOnly ? "default" : "pointer" }}
            >
              <input
                type="checkbox"
                checked={values.is_mandatory}
                disabled={readOnly}
                onChange={(e) => setValues((prev) => ({ ...prev, is_mandatory: e.target.checked }))}
              />
              <span style={{ ...labelSt, marginBottom: 0 }}>{t("requiredToComplete")}</span>
            </label>
            <p style={hintSt}>{t("requiredToCompleteHint")}</p>
          </div>
        </div>

        {!readOnly && (
          <ModalFooter
            onCancel={onClose}
            submitLabel={t("saveLesson")}
            loading={loading}
            disabled={!values.title.trim() || loading}
          />
        )}
      </form>
    </ModalShell>
  );
}
