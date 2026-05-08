import { AccentButton } from "@/shared/ui/AccentButton";
import type { UserData, UserLanguage } from "@/entities/user";
import { ProfileField, ProfileLanguageField, formatDate } from "./ProfileField";

type Props = {
    user: UserData;
    editing: boolean;
    saving: boolean;
    completionPercent: number;
    firstName: string;
    lastName: string;
    language: UserLanguage;
    onFirstNameChange: (v: string) => void;
    onLastNameChange: (v: string) => void;
    onLanguageChange: (v: UserLanguage) => void;
    onSave: () => void;
    children?: React.ReactNode;
};

export function ProfileMainContent({
    user, editing, saving, completionPercent,
    firstName, lastName, language,
    onFirstNameChange, onLastNameChange, onLanguageChange,
    onSave, children,
}: Props) {
    const fullName = `${user.first_name} ${user.last_name}`.trim();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5vw" }}>

            {/* Heading */}
            <div>
                <h1 style={{
                    fontFamily: "var(--font-base)", fontWeight: 700,
                    fontSize: "2.083vw", color: "var(--color-text-primary)",
                    lineHeight: 1.25, margin: 0,
                }}>
                    My profile
                </h1>
                <p style={{
                    marginTop: "0.417vw", marginBottom: 0,
                    fontFamily: "var(--font-base)", fontSize: "1.04vw", fontWeight: 500,
                    color: "var(--color-text-primary)", letterSpacing: "-0.011em",
                }}>
                    Please fill in your details. This will help us provide you with even better course recommendations.
                </p>
            </div>

            {/* Progress bar */}
            <div>
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    marginBottom: "0.417vw", letterSpacing: "-0.011em",
                }}>
                    <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "1.04vw", color: "var(--color-text-primary)" }}>
                        Profile completion
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

            {/* Fields grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25vw 2.08vw" }}>
                {editing ? (
                    <>
                        <ProfileField
                            label="First name" value={user.first_name}
                            editing={editing} inputValue={firstName} onInputChange={onFirstNameChange}
                        />
                        <ProfileField
                            label="Last name" value={user.last_name}
                            editing={editing} inputValue={lastName} onInputChange={onLastNameChange}
                        />
                    </>
                ) : (
                    <>
                        <ProfileField label="Surname and first name" value={fullName} />
                        <ProfileField label="Password" value="••••••••••••••" />
                    </>
                )}

                <ProfileField label="Email" value={user.email} />

                <ProfileLanguageField
                    value={user.language} editing={true}
                    inputValue={language} onInputChange={onLanguageChange}
                />

                <ProfileField label="Date of registration" value={formatDate(user.date_joined)} />
            </div>

            {/* Role-specific fields */}
            {children}

            {/* Save button */}
            {editing && (
                <div>
                    <AccentButton size="md" onClick={onSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </AccentButton>
                </div>
            )}
        </div>
    );
}