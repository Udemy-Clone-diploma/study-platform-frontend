import { useTranslations } from "next-intl";
import { AccentButton } from "@/shared/ui/AccentButton";
import { PILL_BTN_MOBILE_CLASS } from "./ProfileField";

type Props = {
  editing: boolean;
  saving: boolean;
  completionPercent: number;
  showSubtitle?: boolean;
  showSaveButton?: boolean;
  /** Message from a failed save, shown above the button. */
  saveError?: string;
  onSave: () => void;
  children?: React.ReactNode;
};

/** Shell for the profile main area: heading, progress bar, role-specific fields, save button. */
export function ProfileMainContent({
  editing,
  saving,
  completionPercent,
  showSubtitle = true,
  showSaveButton = true,
  saveError,
  onSave,
  children,
}: Props) {
  const t = useTranslations("Profile");
  return (
    <div className="flex flex-col gap-6 lg:gap-[1.5vw]">
      <div>
        <h1
          className="text-center lg:text-left"
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(32px, 2.083vw, 40px)",
            color: "var(--color-text-primary)",
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          {t("title")}
        </h1>
        {showSubtitle && (
          <p
            className="mt-2 lg:mt-[0.417vw]"
            style={{
              marginBottom: 0,
              fontFamily: "var(--font-base)",
              fontSize: "clamp(16px, 1.04vw, 20px)",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.011em",
            }}
          >
            {t("subtitle")}
          </p>
        )}
      </div>

      <div>
        <div
          className="mb-5 flex items-baseline justify-between lg:mb-[0.417vw]"
          style={{ letterSpacing: "-0.011em" }}
        >
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "20px",
              color: "var(--color-text-primary)",
            }}
          >
            {t("completion")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-accent)",
              fontWeight: 600,
              fontSize: "clamp(20px, 1.25vw, 24px)",
              color: "var(--color-blue)",
            }}
          >
            {completionPercent}%
          </span>
        </div>
        <div
          style={{
            position: "relative",
            height: "clamp(6px, 0.42vw, 8px)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{ position: "absolute", inset: 0, background: "var(--color-brand-lavender)" }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${completionPercent}%`,
              background: "var(--color-blue)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {children}

      {editing && showSaveButton && (
        <div className="flex flex-col items-center gap-3 lg:items-start">
          {saveError && (
            <p
              role="alert"
              className="m-0 text-center text-(--color-danger) lg:text-left"
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: "clamp(16px, 1.04vw, 20px)",
                letterSpacing: "-0.011em",
              }}
            >
              {saveError}
            </p>
          )}
          <AccentButton
            size="md"
            onClick={onSave}
            disabled={saving}
            className={PILL_BTN_MOBILE_CLASS}
          >
            {saving ? t("saving") : t("save")}
          </AccentButton>
        </div>
      )}
    </div>
  );
}
