"use client";

import { useState, useEffect } from "react";
import { withAuth } from "@/features/auth/ui/withAuth";
import { getMe } from "@/entities/user";
import { updateMe, uploadAvatar, updateTeacherProfile, updateStudentProfile } from "@/features/auth/api/authApi";
import type { UserData, UserLanguage, TeacherProfile, StudentProfile } from "@/entities/user";
import { ProfileBgBlobs } from "@/features/profile/ui/ProfileBgBlobs";
import { ProfileSidebar, type SocialLinks } from "@/features/profile/ui/ProfileSidebar";
import { ProfileMainContent } from "@/features/profile/ui/ProfileMainContent";
import { TeacherFields } from "@/features/profile/ui/TeacherFields";
import { StudentFields } from "@/features/profile/ui/StudentFields";

const GRAD_LINE: React.CSSProperties = {
    width: "4px", flexShrink: 0,
    background: "var(--gradient-profile-line)",
};

function calcCompletion(user: UserData, social: SocialLinks, extraChecks: boolean[] = [], includeSocial = true): number {
    const checks: boolean[] = [
        !!user.first_name,
        !!user.last_name,
        !!user.avatar,
    ];
    if (includeSocial) checks.push(Object.values(social).some(Boolean));
    checks.push(...extraChecks);
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function socialFromUser(user: UserData): SocialLinks {
    return {
        instagram: user.instagram ?? "",
        linkedin:  user.linkedin  ?? "",
        facebook:  user.facebook  ?? "",
        behance:   user.behance   ?? "",
    };
}

function ProfilePage() {
    const [user, setUser]               = useState<UserData | null>(null);
    const [loading, setLoading]         = useState(true);
    const [editing, setEditing]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [firstName, setFirstName]     = useState("");
    const [lastName, setLastName]       = useState("");
    const [language, setLanguage]       = useState<UserLanguage>("en");
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({ instagram: "", linkedin: "", facebook: "", behance: "" });
    const [avatarFile, setAvatarFile]   = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Teacher-specific edit state
    const [specialization, setSpecialization] = useState("");
    const [experience, setExperience]         = useState("");
    const [bio, setBio]                       = useState("");

    // Student-specific edit state
    const [dateOfBirth, setDateOfBirth]       = useState("");
    const [learningGoals, setLearningGoals]   = useState("");
    const [educationLevel, setEducationLevel] = useState("");

    useEffect(() => {
        getMe()
            .then(data => {
                setUser(data);
                setFirstName(data.first_name);
                setLastName(data.last_name);
                setLanguage(data.language);
                setSocialLinks(socialFromUser(data));
            })
            .finally(() => setLoading(false));
    }, []);

    function handleEdit() {
        if (!user) return;
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setLanguage(user.language);
        setSocialLinks(socialFromUser(user));
        setAvatarFile(null);
        setAvatarPreview(null);
        if (user.role === "teacher") {
            const tp = user.profile as TeacherProfile;
            setSpecialization(tp?.specialization ?? "");
            setExperience(tp?.experience ?? "");
            setBio(tp?.bio ?? "");
        } else if (user.role === "student") {
            const sp = user.profile as StudentProfile;
            setDateOfBirth(sp?.date_of_birth ?? "");
            setLearningGoals(sp?.learning_goals ?? "");
            setEducationLevel(sp?.education_level ?? "");
        }
        setEditing(true);
    }

    function handleCancel() {
        if (user) {
            setSocialLinks(socialFromUser(user));
            setLanguage(user.language);
            if (user.role === "teacher") {
                const tp = user.profile as TeacherProfile;
                setSpecialization(tp?.specialization ?? "");
                setExperience(tp?.experience ?? "");
                setBio(tp?.bio ?? "");
            } else if (user.role === "student") {
                const sp = user.profile as StudentProfile;
                setDateOfBirth(sp?.date_of_birth ?? "");
                setLearningGoals(sp?.learning_goals ?? "");
                setEducationLevel(sp?.education_level ?? "");
            }
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        setEditing(false);
    }

    async function handleLanguageChange(lang: UserLanguage) {
        setLanguage(lang);
        if (!editing) {
            const updated = await updateMe({ language: lang });
            setUser(updated);
        }
    }

    function handleAvatarChange(file: File) {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }

    async function handleSave() {
        setSaving(true);
        const minimal = user?.role === "administrator" || user?.role === "moderator";
        try {
            let updated = await updateMe({
                first_name: firstName,
                last_name:  lastName,
                language,
                ...(minimal ? {} : {
                    instagram: socialLinks.instagram,
                    linkedin:  socialLinks.linkedin,
                    facebook:  socialLinks.facebook,
                    behance:   socialLinks.behance,
                }),
            });

            if (user?.role === "teacher") {
                updated = await updateTeacherProfile({ specialization, experience, bio });
            } else if (user?.role === "student") {
                updated = await updateStudentProfile({
                    date_of_birth:   dateOfBirth || null,
                    learning_goals:  learningGoals,
                    education_level: educationLevel,
                });
            }

            if (avatarFile) {
                updated = await uploadAvatar(avatarFile);
            }

            setUser(updated);
            setSocialLinks(socialFromUser(updated));
            setAvatarFile(null);
            setAvatarPreview(null);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    function handleSocialChange(key: keyof SocialLinks, value: string) {
        setSocialLinks(prev => ({ ...prev, [key]: value }));
    }

    if (loading) return (
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-base)", color: "var(--color-text-secondary)", fontSize: "1.04vw" }}>
                Loading...
            </span>
        </div>
    );
    if (!user) return null;

    const isMinimal = user.role === "administrator" || user.role === "moderator";
    const teacherProfile = user.role === "teacher" ? user.profile as TeacherProfile : null;
    const studentProfile = user.role === "student" ? user.profile as StudentProfile : null;
    const completionExtras = teacherProfile
        ? [!!teacherProfile.specialization, !!teacherProfile.experience, !!teacherProfile.bio]
        : studentProfile
        ? [!!studentProfile.date_of_birth, !!studentProfile.learning_goals, !!studentProfile.education_level]
        : [];

    return (
        <div style={{ position: "relative" }}>
            <ProfileBgBlobs />

            <div style={{ position: "relative", zIndex: 1, display: "flex" }}>
                <div style={{ width: "4.17vw", flexShrink: 0 }} />
                <div style={GRAD_LINE} />

                <ProfileSidebar
                    user={user}
                    editing={editing}
                    avatarPreview={avatarPreview}
                    socialLinks={socialLinks}
                    teacherRating={teacherProfile?.rating}
                    showSocial={!isMinimal}
                    onSocialChange={handleSocialChange}
                    onAvatarChange={handleAvatarChange}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                />

                <div style={GRAD_LINE} />

                <div style={{ flex: 1, padding: "4.17vw 9.375vw 6.25vw 2.08vw" }}>
                    <ProfileMainContent
                        user={user} editing={editing} saving={saving}
                        completionPercent={calcCompletion(user, socialLinks, completionExtras, !isMinimal)}
                        showSubtitle={!isMinimal}
                        firstName={firstName} lastName={lastName} language={language}
                        onFirstNameChange={setFirstName}
                        onLastNameChange={setLastName}
                        onLanguageChange={handleLanguageChange}
                        onSave={handleSave}
                    >
                        {teacherProfile && (
                            <TeacherFields
                                editing={editing}
                                profile={teacherProfile}
                                specialization={specialization}
                                experience={experience}
                                bio={bio}
                                onSpecializationChange={setSpecialization}
                                onExperienceChange={setExperience}
                                onBioChange={setBio}
                            />
                        )}
                        {studentProfile && (
                            <StudentFields
                                editing={editing}
                                profile={studentProfile}
                                dateOfBirth={dateOfBirth}
                                learningGoals={learningGoals}
                                educationLevel={educationLevel}
                                onDateOfBirthChange={setDateOfBirth}
                                onLearningGoalsChange={setLearningGoals}
                                onEducationLevelChange={setEducationLevel}
                            />
                        )}
                    </ProfileMainContent>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfilePage, {
    allowedRoles: ["student", "teacher", "moderator", "administrator"],
});
