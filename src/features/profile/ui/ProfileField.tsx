"use client";

import { useState, useRef, useEffect } from "react";
import type { UserLanguage } from "@/entities/user";
import { LOCALE_OPTIONS } from "@/shared/lib/useLocaleSwitcher";

export const LABEL_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontWeight: 600,
    fontSize: "1.25vw", color: "var(--color-text-secondary)",
    letterSpacing: "-0.011em", lineHeight: 1.5,
};

export const VALUE_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-base)", fontWeight: 600,
    fontSize: "1.25vw", color: "var(--color-text-primary)",
    letterSpacing: "-0.011em", lineHeight: 1.5,
};

export const INPUT_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontWeight: 400,
    fontSize: "1.04vw",
    color: "var(--color-text-secondary)",
    letterSpacing: "-0.011em",
    lineHeight: 1.5,
    background: "var(--color-bg)",
    border: "1px solid var(--color-text-primary)",
    boxShadow: "none",
    borderRadius: "2.083vw",
    padding: "0.521vw 1.042vw",
    outline: "none",
    width: "100%",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
};

export const TEXTAREA_STYLE: React.CSSProperties = {
    ...INPUT_STYLE,
    borderRadius: "0.833vw",
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

export function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
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
                    borderRadius: "1.094vw",
                    padding: "0.521vw 1.042vw 1.042vw",
                    display: "flex", flexDirection: "column", gap: "0.521vw",
                    boxShadow: "var(--shadow-card)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{
                            fontFamily: "var(--font-base)", fontWeight: 400,
                            fontSize: "1.042vw", color: "var(--color-text-primary)",
                        }}>
                            {selectedLabel}
                        </span>
                        <Caret up />
                    </div>

                    <div style={{ height: "1px", background: "var(--color-draft)" }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.042vw", paddingTop: "0.26vw" }}>
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    background: "none", border: "none", padding: 0,
                                    cursor: "pointer", textAlign: "left",
                                    fontFamily: "var(--font-base)", fontWeight: 400,
                                    fontSize: "1.042vw", lineHeight: 1.25,
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
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
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
            <span style={LABEL_STYLE}>Website language</span>
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
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
            <span style={LABEL_STYLE}>Languages of instruction</span>
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
