"use client";

export type CourseTest = {
  id: number;
  title: string;
  question_count?: number;
  pass_percent?: number;
};

type ItemStatus = "approved" | "rejected" | "needs_revision";

type Props = {
  test: CourseTest;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Read-only moderation status badge from moderator review. */
  moderationStatus?: ItemStatus;
  /** True when this item is approved by moderator — edit/delete hidden, row dimmed. */
  locked?: boolean;
};

function StatusBadge({ status }: { status: ItemStatus }) {
  const src =
    status === "approved"
      ? "/icons/yes.svg"
      : status === "rejected"
        ? "/icons/no.svg"
        : "/icons/refine.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={status}
      width={22}
      height={22}
      style={{ width: 22, height: 22, flexShrink: 0 }}
    />
  );
}

const metaSt: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 600,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-secondary)",
  whiteSpace: "nowrap",
};

/** Bordered card for a single course test — icon + title + metadata + edit/delete actions. */
export function TestRow({ test, onEdit, onDelete, moderationStatus, locked }: Props) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: "var(--color-bg)",
        border: "2px solid var(--color-border-light)",
        borderRadius: 16,
        padding: "clamp(20px, 2.22vw, 32px) clamp(20px, 2.22vw, 32px)",
        opacity: locked ? 0.55 : 1,
      }}
    >
      <div className="flex min-w-0 items-center" style={{ gap: "clamp(12px, 1.32vw, 19px)" }}>
        <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/copy-check.svg"
            alt=""
            width={24}
            height={24}
            style={{ width: 24, height: 24, flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(14px, 1.39vw, 20px)",
              lineHeight: "25px",
              color: "var(--color-text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {test.title}
          </span>
        </div>

        {test.question_count != null && <span style={metaSt}>{test.question_count} questions</span>}
        {test.pass_percent != null && <span style={metaSt}>Pass: {test.pass_percent}%</span>}
      </div>

      <div className="flex shrink-0 items-center" style={{ gap: 8 }}>
        {moderationStatus && <StatusBadge status={moderationStatus} />}
        {(onEdit || onDelete) && (
          <>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
                style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
                aria-label="Edit test"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/edit.svg"
                  alt=""
                  width={20}
                  height={20}
                  style={{ width: 20, height: 20 }}
                />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center justify-center rounded-full transition hover:bg-red-50"
                style={{ width: 40, height: 40, padding: 6, flexShrink: 0 }}
                aria-label="Delete test"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/trash.svg"
                  alt=""
                  width={20}
                  height={20}
                  style={{ width: 20, height: 20 }}
                />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
