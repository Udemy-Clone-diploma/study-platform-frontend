"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { UserLanguage } from "@/entities/user";
import { LOCALE_OPTIONS } from "@/shared/lib/useLocaleSwitcher";

/** Label-to-value gap. Floors at the design's 4px so it doesn't collapse on phones. */
export const FIELD_GAP = "max(4px, 0.208vw)";

/**
 * Below `lg` the pill buttons follow the mobile design (46px tall, 160px wide,
 * 16px label) instead of AccentButton's desktop clamps. `!` is required because
 * AccentButton applies its sizes through the `style` prop.
 */
export const PILL_BTN_MOBILE_CLASS =
    "max-lg:!h-[46px] max-lg:!min-w-[160px] max-lg:!text-base";

export const LABEL_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontWeight: 600,
    fontSize: "clamp(20px, 1.25vw, 24px)", color: "var(--color-text-secondary)",
    letterSpacing: "-0.011em", lineHeight: 1.5,
};

export const VALUE_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontWeight: 600,
    fontSize: "clamp(20px, 1.25vw, 24px)", color: "var(--color-text-primary)",
    letterSpacing: "-0.011em", lineHeight: 1.5,
};

export const INPUT_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontWeight: 400,
    fontSize: "clamp(16px, 1.04vw, 20px)",
    color: "var(--color-text-secondary)",
    letterSpacing: "-0.011em",
    lineHeight: 1.5,
    background: "var(--color-bg)",
    border: "1px solid var(--color-text-primary)",
    boxShadow: "none",
    borderRadius: "999px",
    padding: "clamp(10px, 0.521vw, 12px) clamp(18px, 1.042vw, 20px)",
    outline: "none",
    width: "100%",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
};

export const TEXTAREA_STYLE: React.CSSProperties = {
    ...INPUT_STYLE,
    borderRadius: "clamp(14px, 0.833vw, 16px)",
    resize: "vertical" as const,
    lineHeight: 1.6,
};

export const LANG_LABELS: Record<UserLanguage, string> = Object.fromEntries(
    LOCALE_OPTIONS.map(o => [o.value, o.label]),
) as Record<UserLanguage, string>;

const LANG_OPTIONS: { value: UserLanguage; label: string }[] = LOCALE_OPTIONS.map(o => ({
    value: o.value as UserLanguage,
    label: o.label,
}));

export function formatDate(iso: string, locale = "en-GB") {
    return new Date(iso).toLocaleDateString(locale, {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
}

function Caret({ up }: { up?: boolean }) {
    return (
        <svg width="16" height="9" viewBox="0 0 16 9" fill="none"
            style={{ transform: up ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0, color: "var(--color-text-primary)" }}>
            <path d="M1 1L8 8L15 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ProfileCustomSelect({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label ?? value;

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    ...INPUT_STYLE,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", width: "100%", boxSizing: "border-box",
                }}
            >
                <span>{selectedLabel}</span>
                <Caret up={open} />
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 0.417vw)", left: 0, right: 0, zIndex: 100,
                    background: "var(--color-bg)",
                    borderRadius: "clamp(14px, 1.094vw, 21px)",
                    padding: "clamp(8px, 0.521vw, 10px) clamp(14px, 1.042vw, 20px) clamp(14px, 1.042vw, 20px)",
                    display: "flex", flexDirection: "column", gap: "clamp(8px, 0.521vw, 10px)",
                    boxShadow: "var(--shadow-card)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{
                            fontFamily: "var(--font-base)", fontWeight: 400,
                            fontSize: "clamp(16px, 1.042vw, 20px)", color: "var(--color-text-primary)",
                        }}>
                            {selectedLabel}
                        </span>
                        <Caret up />
                    </div>

                    <div style={{ height: "1px", background: "var(--color-draft)" }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.042vw, 20px)", paddingTop: "0.26vw" }}>
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    background: "none", border: "none", padding: 0,
                                    cursor: "pointer", textAlign: "left",
                                    fontFamily: "var(--font-base)", fontWeight: 400,
                                    fontSize: "clamp(16px, 1.042vw, 20px)", lineHeight: 1.25,
                                    color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)",
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export type ProfileFieldProps = {
    label: string;
    value: string;
    editing?: boolean;
    inputValue?: string;
    onInputChange?: (v: string) => void;
};

export function ProfileField({ label, value, editing, inputValue, onInputChange }: ProfileFieldProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: FIELD_GAP }}>
            <span style={LABEL_STYLE}>{label}</span>
            {editing && onInputChange ? (
                <input style={INPUT_STYLE} value={inputValue ?? value}
                    onChange={e => onInputChange(e.target.value)} />
            ) : (
                <span style={VALUE_STYLE}>{value || "—"}</span>
            )}
        </div>
    );
}

export type ProfileLanguageFieldProps = {
    value: UserLanguage;
    inputValue: UserLanguage;
    onInputChange: (v: UserLanguage) => void;
};

export function ProfileLanguageField({ inputValue, onInputChange }: ProfileLanguageFieldProps) {
    const t = useTranslations("ProfileFields");
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: FIELD_GAP }}>
            <span style={LABEL_STYLE}>{t("websiteLanguage")}</span>
            <ProfileCustomSelect
                options={LANG_OPTIONS}
                value={inputValue}
                onChange={v => onInputChange(v as UserLanguage)}
            />
        </div>
    );
}

export type ProfileInstructionLanguageFieldProps = {
    editing: boolean;
    value: UserLanguage;
    inputValue: UserLanguage;
    onInputChange: (v: UserLanguage) => void;
};

/** Teaching language field — editable in edit mode, read-only otherwise. */
export function ProfileInstructionLanguageField({ editing, value, inputValue, onInputChange }: ProfileInstructionLanguageFieldProps) {
    const t = useTranslations("ProfileFields");
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: FIELD_GAP }}>
            <span style={LABEL_STYLE}>{t("instructionLanguages")}</span>
            {editing ? (
                <ProfileCustomSelect
                    options={LANG_OPTIONS}
                    value={inputValue}
                    onChange={v => onInputChange(v as UserLanguage)}
                />
            ) : (
                <span style={VALUE_STYLE}>{LANG_LABELS[value] || "—"}</span>
            )}
        </div>
    );
}
