"use client";

import { useTranslations } from "next-intl";
import type { ItemStatus } from "../model/moderatorReview";

/** Clickable cycle badge for moderator per-item status (null → approved → needs_revision → rejected). */
export function ModeratorItemStatusBadge({ status, onClick, locked = false }: { status: ItemStatus; onClick: () => void; locked?: boolean }) {
  const t = useTranslations("ModeratorItemStatusBadge");
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      title={locked ? t("autoApprovedTitle") : t("clickToChangeTitle")}
      style={{ background: "transparent", border: "none", cursor: locked ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, width: 40, height: 40, opacity: locked ? 0.45 : 1 }}
      aria-label={locked ? t("autoApprovedAriaLabel") : t("toggleAriaLabel")}
    >
      {status === "approved" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/yes.svg" alt="approved" width={40} height={40} style={{ width: 40, height: 40 }} />
      )}
      {status === "rejected" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/no.svg" alt="rejected" width={40} height={40} style={{ width: 40, height: 40 }} />
      )}
      {status === "needs_revision" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/refine.svg" alt="needs revision" width={22} height={22} style={{ width: 22, height: 22 }} />
      )}
      {status === null && (
        <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px dashed var(--color-draft)", display: "block" }} />
      )}
    </button>
  );
}
