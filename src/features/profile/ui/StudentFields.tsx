import { ProfileField, LABEL_STYLE, VALUE_STYLE, INPUT_STYLE, formatDate } from "./ProfileField";
import type { StudentProfile } from "@/entities/user";

type Props = {
    editing: boolean;
    profile: StudentProfile | null;
    dateOfBirth: string;
    learningGoals: string;
    educationLevel: string;
    onDateOfBirthChange: (v: string) => void;
    onLearningGoalsChange: (v: string) => void;
    onEducationLevelChange: (v: string) => void;
};

export function StudentFields({
    editing, profile,
    dateOfBirth, learningGoals, educationLevel,
    onDateOfBirthChange, onLearningGoalsChange, onEducationLevelChange,
}: Props) {
    const dobDisplay = profile?.date_of_birth ? formatDate(profile.date_of_birth) : "—";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25vw" }}>
            <div style={{ display: "flex", gap: "2.08vw" }}>
                <div style={{ flex: 1 }}>
                    {editing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                            <span style={LABEL_STYLE}>Date of birth</span>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={e => onDateOfBirthChange(e.target.value)}
                                style={INPUT_STYLE}
                            />
                        </div>
                    ) : (
                        <ProfileField label="Date of birth" value={dobDisplay} />
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <ProfileField label="Education level"
                        value={profile?.education_level || "—"}
                        editing={editing} inputValue={educationLevel}
                        onInputChange={onEducationLevelChange}
                    />
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                <span style={LABEL_STYLE}>Learning goals</span>
                {editing ? (
                    <textarea
                        value={learningGoals}
                        onChange={e => onLearningGoalsChange(e.target.value)}
                        rows={4}
                        style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.5 }}
                    />
                ) : (
                    <span style={VALUE_STYLE}>{profile?.learning_goals || "—"}</span>
                )}
            </div>
        </div>
    );
}
