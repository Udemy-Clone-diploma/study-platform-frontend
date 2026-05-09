import type { UserLanguage } from "@/entities/user";

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
    ...VALUE_STYLE,
    background: "var(--color-white-85)",
    border: "1px solid var(--color-placeholder)",
    borderRadius: "0.417vw",
    padding: "0.417vw 0.625vw",
    outline: "none", width: "100%",
};

export const LANG_LABELS: Record<UserLanguage, string> = { en: "English", uk: "Ukrainian" };

export function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
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
    editing: boolean;
    inputValue: UserLanguage;
    onInputChange: (v: UserLanguage) => void;
};

export function ProfileLanguageField({ value, editing, inputValue, onInputChange }: ProfileLanguageFieldProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
            <span style={LABEL_STYLE}>Website language</span>
            {editing ? (
                <select style={{ ...INPUT_STYLE, cursor: "pointer" }}
                    value={inputValue}
                    onChange={e => onInputChange(e.target.value as UserLanguage)}>
                    <option value="en">English</option>
                    <option value="uk">Ukrainian</option>
                </select>
            ) : (
                <span style={VALUE_STYLE}>{LANG_LABELS[value]}</span>
            )}
        </div>
    );
}