"use client";

import { useRef } from "react";
import { ProfileField, ProfileLanguageField, ProfileInstructionLanguageField, LABEL_STYLE, VALUE_STYLE, TEXTAREA_STYLE, formatDate } from "./ProfileField";
import type { TeacherProfile, UserLanguage } from "@/entities/user";

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
    instructionLanguage: UserLanguage;
    profile: TeacherProfile | null;
    specialization: string;
    experience: string;
    bio: string;
    yearsExperience: string;
    partnershipsCount: string;
    signaturePreview: string | null;
    onSignatureChange: (file: File) => void;
    onFirstNameChange: (v: string) => void;
    onLastNameChange: (v: string) => void;
    onLanguageChange: (v: UserLanguage) => void;
    onInstructionLanguageChange: (v: UserLanguage) => void;
    onSpecializationChange: (v: string) => void;
    onExperienceChange: (v: string) => void;
    onBioChange: (v: string) => void;
    onYearsExperienceChange: (v: string) => void;
    onPartnershipsCountChange: (v: string) => void;
    onChangePassword: () => void;
};

/** Profile fields for the teacher role — 3-column grid + bio below. */
export function TeacherFields({
    editing, email, dateJoined,
    firstName, lastName, language, instructionLanguage,
    profile, specialization, experience, bio, yearsExperience, partnershipsCount,
    signaturePreview, onSignatureChange,
    onFirstNameChange, onLastNameChange, onLanguageChange, onInstructionLanguageChange,
    onSpecializationChange, onExperienceChange, onBioChange,
    onYearsExperienceChange, onPartnershipsCountChange,
    onChangePassword,
}: Props) {
    const signatureFileRef = useRef<HTMLInputElement>(null);
    const signatureSrc = signaturePreview ?? profile?.signature ?? null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25vw" }}>

            {/* 3-column grid */}
            <div style={GRID_3}>
                {/* Row 1 */}
                <ProfileField
                    label="First name" value={firstName}
                    editing={editing} inputValue={firstName} onInputChange={onFirstNameChange}
                />
                <ProfileField
                    label="Field of study" value={profile?.specialization || "—"}
                    editing={editing} inputValue={specialization} onInputChange={onSpecializationChange}
                />
                <ProfileField label="Email" value={email} />

                {/* Row 2 */}
                <ProfileField
                    label="Last name" value={lastName}
                    editing={editing} inputValue={lastName} onInputChange={onLastNameChange}
                />
                <ProfileInstructionLanguageField
                    editing={editing}
                    value={instructionLanguage}
                    inputValue={instructionLanguage}
                    onInputChange={onInstructionLanguageChange}
                />
                <ProfileField label="Date of registration" value={formatDate(dateJoined)} />

                {/* Row 3 */}
                <ProfileField
                    label="Work experience" value={profile?.experience || "—"}
                    editing={editing} inputValue={experience} onInputChange={onExperienceChange}
                />
                <ProfileLanguageField
                    value={language}
                    inputValue={language} onInputChange={onLanguageChange}
                />

                {/* Password cell */}
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

                {/* Row 4 — optional course-detail instructor-card stats. Shown there only if set. */}
                <ProfileField
                    label="Years of experience (optional)" value={profile?.years_experience != null ? String(profile.years_experience) : "—"}
                    editing={editing} inputValue={yearsExperience} onInputChange={onYearsExperienceChange}
                />
                <ProfileField
                    label="Partnerships with companies (optional)" value={profile?.partnerships_count != null ? String(profile.partnerships_count) : "—"}
                    editing={editing} inputValue={partnershipsCount} onInputChange={onPartnershipsCountChange}
                />
            </div>

            {/* Bio — full width below the grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                <span style={LABEL_STYLE}>Bio</span>
                {editing ? (
                    <textarea
                        value={bio}
                        onChange={e => onBioChange(e.target.value)}
                        rows={4}
                        style={TEXTAREA_STYLE}
                    />
                ) : (
                    <span style={VALUE_STYLE}>{profile?.bio || "—"}</span>
                )}
            </div>

            {/* Signature — drawn onto generated course certificates */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                <span style={LABEL_STYLE}>Signature</span>
                <p style={{ ...VALUE_STYLE, fontWeight: 400, color: "var(--color-text-secondary)", margin: 0 }}>
                    Required before you can enable certificates on a course.
                </p>
                <div
                    onClick={editing ? () => signatureFileRef.current?.click() : undefined}
                    style={{
                        width: "12vw", height: "5vw", borderRadius: 12,
                        border: "1px dashed var(--color-border-light)",
                        background: "var(--color-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: editing ? "pointer" : "default", overflow: "hidden",
                    }}
                >
                    {signatureSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signatureSrc} alt="Signature" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                        <span style={{ ...VALUE_STYLE, fontWeight: 400, color: "var(--color-text-muted)", fontSize: "0.9vw" }}>
                            {editing ? "Click to upload" : "Not uploaded"}
                        </span>
                    )}
                </div>
                <input
                    ref={signatureFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onSignatureChange(file);
                    }}
                />
            </div>
        </div>
    );
}
