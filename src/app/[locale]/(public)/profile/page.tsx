"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { updateMe, uploadAvatar, uploadTeacherSignature, updateTeacherProfile, updateStudentProfile, withAuth } from "@/features/auth";
import { getMe } from "@/entities/user";
import type { UserData, UserLanguage, TeacherProfile, StudentProfile } from "@/entities/user";
import {
  ProfileBgBlobs,
  ProfileMainContent,
  ProfileSidebar,
  StudentFields,
  TeacherFields,
  PasswordChangeModal,
  type SocialLinks,
} from "@/features/profile";

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
    const t = useTranslations("Profile");
    const router = useRouter();
    const pathname = usePathname();
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
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Teacher-specific edit state
    const [specialization, setSpecialization]             = useState("");
    const [experience, setExperience]                     = useState("");
    const [bio, setBio]                                   = useState("");
    const [yearsExperience, setYearsExperience]           = useState("");
    const [partnershipsCount, setPartnershipsCount]       = useState("");
    const [instructionLanguage, setInstructionLanguage]   = useState<UserLanguage>("en");
    const [signatureFile, setSignatureFile]               = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview]         = useState<string | null>(null);

    // Student-specific edit state
    const [dateOfBirth, setDateOfBirth]     = useState("");
    const [learningGoals, setLearningGoals] = useState("");

    useEffect(() => {
        getMe()
            .then(data => {
                setUser(data);
                setFirstName(data.first_name);
                setLastName(data.last_name);
                setLanguage(data.language);
                setSocialLinks(socialFromUser(data));
                if (data.role === "teacher") {
                    const tp = data.profile as TeacherProfile;
                    setSpecialization(tp?.specialization ?? "");
                    setExperience(tp?.experience ?? "");
                    setBio(tp?.bio ?? "");
                    setYearsExperience(tp?.years_experience != null ? String(tp.years_experience) : "");
                    setPartnershipsCount(tp?.partnerships_count != null ? String(tp.partnerships_count) : "");
                } else if (data.role === "student") {
                    const sp = data.profile as StudentProfile;
                    setDateOfBirth(sp?.date_of_birth ?? "");
                    setLearningGoals(sp?.learning_goals ?? "");
                }
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
        setSignatureFile(null);
        setSignaturePreview(null);
        if (user.role === "teacher") {
            const tp = user.profile as TeacherProfile;
            setSpecialization(tp?.specialization ?? "");
            setExperience(tp?.experience ?? "");
            setBio(tp?.bio ?? "");
            setYearsExperience(tp?.years_experience != null ? String(tp.years_experience) : "");
            setPartnershipsCount(tp?.partnerships_count != null ? String(tp.partnerships_count) : "");
        } else if (user.role === "student") {
            const sp = user.profile as StudentProfile;
            setDateOfBirth(sp?.date_of_birth ?? "");
            setLearningGoals(sp?.learning_goals ?? "");
        }
        setEditing(true);
    }

    function handleCancel() {
        if (user) {
            setFirstName(user.first_name);
            setLastName(user.last_name);
            setSocialLinks(socialFromUser(user));
            setLanguage(user.language);
            if (user.role === "teacher") {
                const tp = user.profile as TeacherProfile;
                setSpecialization(tp?.specialization ?? "");
                setExperience(tp?.experience ?? "");
                setBio(tp?.bio ?? "");
                setYearsExperience(tp?.years_experience != null ? String(tp.years_experience) : "");
                setPartnershipsCount(tp?.partnerships_count != null ? String(tp.partnerships_count) : "");
            } else if (user.role === "student") {
                const sp = user.profile as StudentProfile;
                setDateOfBirth(sp?.date_of_birth ?? "");
                setLearningGoals(sp?.learning_goals ?? "");
            }
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        setSignatureFile(null);
        setSignaturePreview(null);
        setEditing(false);
    }

    async function handleLanguageChange(lang: UserLanguage) {
        setLanguage(lang);
        if (!editing) {
            const updated = await updateMe({ language: lang });
            setUser(updated);
            router.replace(pathname, { locale: lang });
        }
    }

    function handleAvatarChange(file: File) {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }

    function handleSignatureChange(file: File) {
        setSignatureFile(file);
        setSignaturePreview(URL.createObjectURL(file));
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
                let profile = await updateTeacherProfile({
                    specialization,
                    experience,
                    bio,
                    years_experience: yearsExperience.trim() ? parseInt(yearsExperience, 10) : null,
                    partnerships_count: partnershipsCount.trim() ? parseInt(partnershipsCount, 10) : null,
                });
                if (signatureFile) {
                    profile = await uploadTeacherSignature(signatureFile);
                }
                updated = { ...updated, profile };
            } else if (user?.role === "student") {
                const profile = await updateStudentProfile({
                    date_of_birth:  dateOfBirth || null,
                    learning_goals: learningGoals,
                });
                updated = { ...updated, profile };
            }

            if (avatarFile) {
                updated = await uploadAvatar(avatarFile);
            }

            setUser(updated);
            setSocialLinks(socialFromUser(updated));
            setAvatarFile(null);
            setAvatarPreview(null);
            setSignatureFile(null);
            setSignaturePreview(null);
            setEditing(false);
            if (updated.language !== user?.language) {
                router.replace(pathname, { locale: updated.language });
            }
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
                {t("loading")}
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
        ? [!!studentProfile.date_of_birth, !!studentProfile.learning_goals]
        : [];

    return (
        <div style={{ position: "relative" }}>
            <ProfileBgBlobs />

            {showPasswordModal && (
                <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
            )}

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
                        editing={editing} saving={saving}
                        completionPercent={calcCompletion(user, socialLinks, completionExtras, !isMinimal)}
                        showSubtitle={!isMinimal}
                        showSaveButton={!studentProfile}
                        onSave={handleSave}
                    >
                        {teacherProfile !== null && (
                            <TeacherFields
                                editing={editing}
                                email={user.email}
                                dateJoined={user.date_joined}
                                firstName={firstName}
                                lastName={lastName}
                                language={language}
                                instructionLanguage={instructionLanguage}
                                profile={teacherProfile}
                                specialization={specialization}
                                experience={experience}
                                bio={bio}
                                yearsExperience={yearsExperience}
                                partnershipsCount={partnershipsCount}
                                signaturePreview={signaturePreview}
                                onSignatureChange={handleSignatureChange}
                                onFirstNameChange={setFirstName}
                                onLastNameChange={setLastName}
                                onLanguageChange={handleLanguageChange}
                                onInstructionLanguageChange={setInstructionLanguage}
                                onYearsExperienceChange={setYearsExperience}
                                onPartnershipsCountChange={setPartnershipsCount}
                                onSpecializationChange={setSpecialization}
                                onExperienceChange={setExperience}
                                onBioChange={setBio}
                                onChangePassword={() => setShowPasswordModal(true)}
                            />
                        )}
                        {studentProfile !== null && (
                            <StudentFields
                                editing={editing}
                                email={user.email}
                                dateJoined={user.date_joined}
                                firstName={firstName}
                                lastName={lastName}
                                language={language}
                                profile={studentProfile}
                                dateOfBirth={dateOfBirth}
                                learningGoals={learningGoals}
                                onFirstNameChange={setFirstName}
                                onLastNameChange={setLastName}
                                onLanguageChange={handleLanguageChange}
                                onDateOfBirthChange={setDateOfBirth}
                                onLearningGoalsChange={setLearningGoals}
                                onChangePassword={() => setShowPasswordModal(true)}
                                onSave={handleSave}
                                saving={saving}
                            />
                        )}
                        {isMinimal && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25vw 2.08vw" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.208vw" }}>
                                    <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "1.25vw", color: "var(--color-text-secondary)", letterSpacing: "-0.011em" }}>{t("email")}</span>
                                    <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "1.25vw", color: "var(--color-text-primary)", letterSpacing: "-0.011em" }}>{user.email}</span>
                                </div>
                            </div>
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
