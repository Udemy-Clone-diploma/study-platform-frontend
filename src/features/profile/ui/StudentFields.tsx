import { ProfileField, ProfileLanguageField, LABEL_STYLE, VALUE_STYLE, INPUT_STYLE, TEXTAREA_STYLE, formatDate } from "./ProfileField";
import { AccentButton } from "@/shared/ui/AccentButton";
import type { StudentProfile, UserLanguage } from "@/entities/user";

const GRID_3: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "2.083vw 8.75vw",
};

type Props = {
    editing: boolean;
    email: string;
    dateJoined: string;
    firstName: string;
    lastName: string;
    language: UserLanguage;
    profile: StudentProfile | null;
    dateOfBirth: string;
    learningGoals: string;
    onFirstNameChange: (v: string) => void;
    onLastNameChange: (v: string) => void;
    onLanguageChange: (v: UserLanguage) => void;
    onDateOfBirthChange: (v: string) => void;
    onLearningGoalsChange: (v: string) => void;
    onChangePassword: () => void;
    onSave: () => void;
    saving: boolean;
};

/** Profile fields for the student role — 3-column grid + learning goals below. */
export function StudentFields({
    editing, email, dateJoined,
    firstName, lastName, language,
    profile, dateOfBirth, learningGoals,
    onFirstNameChange, onLastNameChange, onLanguageChange,
    onDateOfBirthChange, onLearningGoalsChange,
    onChangePassword, onSave, saving,
}: Props) {
    const dobDisplay = profile?.date_of_birth ? formatDate(profile.date_of_birth) : "—";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25vw" }}>

            <div style={GRID_3}>
                {/* Row 1 */}
                <ProfileField
                    label="First name" value={firstName}
                    editing={editing} inputValue={firstName} onInputChange={onFirstNameChange}
                />
                <ProfileField label="Email" value={email} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                    <span style={LABEL_STYLE}>Date of birth</span>
                    {editing ? (
                        <input
                            type="date"
                            value={dateOfBirth}
                            onChange={e => onDateOfBirthChange(e.target.value)}
                            style={INPUT_STYLE}
                        />
                    ) : (
                        <span style={VALUE_STYLE}>{dobDisplay}</span>
                    )}
                </div>

                {/* Row 2 */}
                <ProfileField
                    label="Last name" value={lastName}
                    editing={editing} inputValue={lastName} onInputChange={onLastNameChange}
                />
                <ProfileField label="Date of registration" value={formatDate(dateJoined)} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                    <span style={LABEL_STYLE}>Learning goals</span>
                    {editing ? (
                        <textarea
                            value={learningGoals}
                            onChange={e => onLearningGoalsChange(e.target.value)}
                            rows={3}
                            style={TEXTAREA_STYLE}
                        />
                    ) : (
                        <span style={VALUE_STYLE}>{profile?.learning_goals || "—"}</span>
                    )}
                </div>

                {/* Row 3 */}
                <ProfileLanguageField
                    value={language}
                    inputValue={language} onInputChange={onLanguageChange}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                    <span style={{ ...LABEL_STYLE, visibility: editing ? "hidden" : "visible" }}>Password</span>
                    {editing ? (
                        <button
                            type="button"
                            onClick={onChangePassword}
                            style={{
                                background: "none", border: "none", padding: 0,
                                fontFamily: "var(--font-base)", fontWeight: 600,
                                fontSize: "1.25vw", color: "var(--color-text-secondary)",
                                cursor: "pointer", textAlign: "left", lineHeight: 1.5,
                                letterSpacing: "-0.011em",
                            }}
                        >
                            Change Password
                        </button>
                    ) : (
                        <span style={VALUE_STYLE}>••••••••••••••</span>
                    )}
                </div>
                {editing && (
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <AccentButton size="md" onClick={onSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </AccentButton>
                    </div>
                )}
            </div>
        </div>
    );
}
