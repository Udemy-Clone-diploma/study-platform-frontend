"use client";

type Props = {
  lesson: { id: number; title: string };
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** Bordered card for a single lesson row — number + title + optional edit/delete. */
export function LessonRow({ lesson, index, onEdit, onDelete }: Props) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: "var(--color-bg)",
        border: "2px solid var(--color-border-light)",
        borderRadius: 16,
        padding: "clamp(20px, 1.67vw, 24px) clamp(24px, 2.22vw, 32px)",
      }}
    >
      <div className="flex min-w-0 items-center" style={{ gap: "clamp(8px, 0.83vw, 16px)" }}>
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 400,
            fontSize: "clamp(16px, 1.39vw, 20px)",
            color: "var(--color-text-secondary)",
            flexShrink: 0,
          }}
        >
          {index + 1}.
        </span>
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: "clamp(16px, 1.39vw, 20px)",
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lesson.title}
        </span>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex shrink-0 items-center" style={{ gap: 8 }}>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
              style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
              aria-label="Edit lesson"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/edit.svg" alt="" width={20} height={20} style={{ width: 20, height: 20 }} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center rounded-full transition hover:bg-red-50"
              style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
              aria-label="Delete lesson"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/trash.svg" alt="" width={20} height={20} style={{ width: 20, height: 20 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
