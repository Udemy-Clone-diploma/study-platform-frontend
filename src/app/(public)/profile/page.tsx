"use client";

import { useState, useEffect } from "react";
import { withAuth } from "@/features/auth/ui/withAuth";
import { getMe } from "@/entities/user";
import { updateMe, uploadAvatar } from "@/features/auth/api/authApi";
import type { UserData, UserLanguage, TeacherProfile } from "@/entities/user";
import { ProfileBgBlobs } from "@/features/profile/ui/ProfileBgBlobs";
import { ProfileSidebar, type SocialLinks } from "@/features/profile/ui/ProfileSidebar";
import { ProfileMainContent } from "@/features/profile/ui/ProfileMainContent";
import { ProfileField } from "@/features/profile/ui/ProfileField";

const GRAD_LINE: React.CSSProperties = {
    width: "4px", flexShrink: 0,
    background: "var(--gradient-profile-line)",
};

function calcCompletion(user: UserData, social: SocialLinks): number {
    const checks = [
        !!user.first_name,
        !!user.last_name,
        !!user.avatar,
        Object.values(social).some(Boolean),
    ];
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
        setEditing(true);
    }

    function handleCancel() {
        if (user) {
            setSocialLinks(socialFromUser(user));
            setLanguage(user.language);
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
        try {
            let updated = await updateMe({
                first_name: firstName,
                last_name:  lastName,
                language,
                instagram: socialLinks.instagram,
                linkedin:  socialLinks.linkedin,
                facebook:  socialLinks.facebook,
                behance:   socialLinks.behance,
            });

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

    const teacherProfile = user.role === "teacher" ? user.profile as TeacherProfile : null;

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
                    onSocialChange={handleSocialChange}
                    onAvatarChange={handleAvatarChange}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                />

                <div style={GRAD_LINE} />

                <div style={{ flex: 1, padding: "4.17vw 9.375vw 6.25vw 2.08vw" }}>
                    <ProfileMainContent
                        user={user} editing={editing} saving={saving}
                        completionPercent={calcCompletion(user, socialLinks)}
                        firstName={firstName} lastName={lastName} language={language}
                        onFirstNameChange={setFirstName}
                        onLastNameChange={setLastName}
                        onLanguageChange={handleLanguageChange}
                        onSave={handleSave}
                    >
                        {teacherProfile && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.083vw 2.08vw" }}>
                                <ProfileField label="Specialization" value={teacherProfile.specialization || "—"} />
                                <ProfileField label="Experience"     value={teacherProfile.experience     || "—"} />
                                <ProfileField label="Bio"            value={teacherProfile.bio            || "—"} />
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