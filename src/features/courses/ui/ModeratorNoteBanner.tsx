import { useTranslations } from "next-intl";

type Props = {
  title?: string;
  comment?: string;
  actionLabel?: string;
  actionColor?: string;
};

/** Pink banner displaying a moderator note/comment, optionally with a status badge. */
export function ModeratorNoteBanner({ title, comment, actionLabel, actionColor }: Props) {
  const t = useTranslations("ModeratorNoteBanner");
  if (!comment && !actionLabel) return null;
  return (
    <div
      style={{
        border: "1px solid var(--color-pink-dark)",
        borderRadius: 12,
        padding: "12px 16px",
        background: "var(--color-bg-moderator-note)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--color-pink-dark)",
            margin: 0,
          }}
        >
          {title ?? t("moderatorNote")}
        </p>
        {actionLabel && actionColor && (
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: 12,
              color: actionColor,
              border: `1px solid ${actionColor}`,
              borderRadius: 20,
              padding: "2px 10px",
            }}
          >
            {actionLabel}
          </span>
        )}
      </div>
      {comment && (
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "20px",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {comment}
        </p>
      )}
    </div>
  );
}
