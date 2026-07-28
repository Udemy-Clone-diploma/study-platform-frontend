import { useTranslations } from "next-intl";
import { AccentButton } from "@/shared/ui/AccentButton";

type Props = {
    editing: boolean;
    saving: boolean;
    completionPercent: number;
    showSubtitle?: boolean;
    showSaveButton?: boolean;
    onSave: () => void;
    children?: React.ReactNode;
};

/** Shell for the profile main area: heading, progress bar, role-specific fields, save button. */
export function ProfileMainContent({
    editing, saving, completionPercent,
    showSubtitle = true,
    showSaveButton = true,
    onSave, children,
}: Props) {
    const t = useTranslations("Profile");
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5vw" }}>

            {/* Heading */}
            <div>
                <h1 style={{
                    fontFamily: "var(--font-base)", fontWeight: 700,
                    fontSize: "2.083vw", color: "var(--color-text-primary)",
                    lineHeight: 1.25, margin: 0,
                }}>
                    {t("title")}
                </h1>
                {showSubtitle && (
                    <p style={{
                        marginTop: "0.417vw", marginBottom: 0,
                        fontFamily: "var(--font-base)", fontSize: "1.04vw", fontWeight: 500,
                        color: "var(--color-text-primary)", letterSpacing: "-0.011em",
                    }}>
                        {t("subtitle")}
                    </p>
                )}
            </div>

            {/* Progress bar */}
            <div>
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    marginBottom: "0.417vw", letterSpacing: "-0.011em",
                }}>
                    <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "1.04vw", color: "var(--color-text-primary)" }}>
                        {t("completion")}
                    </span>
                    <span style={{ fontFamily: "var(--font-accent)", fontWeight: 700, fontSize: "1.25vw", color: "var(--color-blue)" }}>
                        {completionPercent}%
                    </span>
                </div>
                <div style={{ position: "relative", height: "0.42vw", borderRadius: "0.26vw", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "var(--color-brand-lavender)" }} />
                    <div style={{
                        position: "absolute", top: 0, left: 0, height: "100%",
                        width: `${completionPercent}%`,
                        background: "var(--color-blue)",
                        transition: "width 0.4s ease",
                    }} />
                </div>
            </div>

            {/* Role-specific fields */}
            {children}

            {/* Save button */}
            {editing && showSaveButton && (
                <div>
                    <AccentButton size="md" onClick={onSave} disabled={saving}>
                        {saving ? t("saving") : t("save")}
                    </AccentButton>
                </div>
            )}
        </div>
    );
}
