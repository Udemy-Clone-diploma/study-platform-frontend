import { ProfileField, LABEL_STYLE, VALUE_STYLE, INPUT_STYLE } from "./ProfileField";
import type { TeacherProfile } from "@/entities/user";

type Props = {
    editing: boolean;
    profile: TeacherProfile | null;
    specialization: string;
    experience: string;
    bio: string;
    onSpecializationChange: (v: string) => void;
    onExperienceChange: (v: string) => void;
    onBioChange: (v: string) => void;
};

export function TeacherFields({
    editing, profile,
    specialization, experience, bio,
    onSpecializationChange, onExperienceChange, onBioChange,
}: Props) {
    return (
        <div style={{ display: "flex", gap: "2.08vw", alignItems: "flex-start" }}>
            {/* Left column: Field of study + Bio — independent height from right */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25vw" }}>
                <ProfileField label="Field of study"
                    value={profile?.specialization || "—"}
                    editing={editing} inputValue={specialization}
                    onInputChange={onSpecializationChange}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                    <span style={LABEL_STYLE}>Bio</span>
                    {editing ? (
                        <textarea
                            value={bio}
                            onChange={e => onBioChange(e.target.value)}
                            rows={4}
                            style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.5 }}
                        />
                    ) : (
                        <span style={VALUE_STYLE}>{profile?.bio || "—"}</span>
                    )}
                </div>
            </div>

            {/* Right column: Work experience — grows independently */}
            <div style={{ flex: 1 }}>
                <ProfileField label="Work experience"
                    value={profile?.experience || "—"}
                    editing={editing} inputValue={experience}
                    onInputChange={onExperienceChange}
                />
            </div>
        </div>
    );
}