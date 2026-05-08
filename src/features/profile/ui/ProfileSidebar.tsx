import Image from "next/image";
import { useRef } from "react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { INPUT_STYLE } from "./ProfileField";
import type { UserData } from "@/entities/user";

export const SOCIAL_ICONS = [
    { key: "instagram", srcGray: "/social-media-icons/instagrm-gray.svg", srcBlack: "/social-media-icons/instagrm.png", label: "Instagram" },
    { key: "linkedin",  srcGray: "/social-media-icons/LinKedln-gray.svg",  srcBlack: "/social-media-icons/LinKedln.png",  label: "LinkedIn" },
    { key: "facebook",  srcGray: "/social-media-icons/Facebook-gray.svg",  srcBlack: "/social-media-icons/Facebook.png",  label: "Facebook" },
    { key: "behance",   srcGray: "/social-media-icons/behance-gray.svg",   srcBlack: "/social-media-icons/behance.png",   label: "Behance" },
] as const;

export type SocialLinks = { instagram: string; linkedin: string; facebook: string; behance: string };

type Props = {
    user: UserData;
    editing: boolean;
    avatarPreview: string | null;
    socialLinks: SocialLinks;
    teacherRating?: string | null;
    showSocial?: boolean;
    onSocialChange: (key: keyof SocialLinks, value: string) => void;
    onAvatarChange: (file: File) => void;
    onEdit: () => void;
    onCancel: () => void;
};

export function ProfileSidebar({ user, editing, avatarPreview, socialLinks, teacherRating, showSocial = true, onSocialChange, onAvatarChange, onEdit, onCancel }: Props) {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    const fileRef = useRef<HTMLInputElement>(null);

    const avatarSrc = avatarPreview ?? user.avatar ?? null;

    return (
        <div style={{
            width: "22.14vw", flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "1.25vw", padding: "4.17vw 1.5vw 6.25vw",
            alignSelf: "flex-start",
        }}>
            {/* Avatar */}
            <div
                onClick={editing ? () => fileRef.current?.click() : undefined}
                style={{
                    width: "12.5vw", height: "12.5vw", borderRadius: "50%",
                    overflow: "hidden", flexShrink: 0, position: "relative",
        background: "var(--color-surface)",
                    cursor: editing ? "pointer" : "default",
                }}
            >
                {avatarSrc ? (
                    <Image src={avatarSrc} alt={fullName} fill unoptimized style={{ objectFit: "cover" }} />
                ) : (
                    <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--gradient-brand)",
                        color: "var(--color-bg)", fontSize: "3vw", fontWeight: 700,
                        fontFamily: "var(--font-base)",
                    }}>
                        {user.first_name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                )}

                {editing && (
                    <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--color-overlay-dark)",
                        color: "var(--color-bg)", fontSize: "0.833vw", fontWeight: 600,
                        fontFamily: "var(--font-base)", textAlign: "center",
                        lineHeight: 1.3,
                    }}>
                        Change<br />photo
                    </div>
                )}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onAvatarChange(file);
                    }}
                />
            </div>

            {/* Full name */}
            <div style={{
                fontFamily: "var(--font-base)", fontWeight: 700,
                fontSize: "2.083vw", color: "var(--color-text-primary)",
                textAlign: "center", lineHeight: 1.25, letterSpacing: "-0.011em",
            }}>
                {fullName || "—"}
            </div>

            {/* Teacher rating */}
            {teacherRating && parseFloat(teacherRating) > 0 && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.417vw",
                    fontFamily: "var(--font-base)", fontWeight: 600,
                    fontSize: "1.25vw", color: "var(--color-text-primary)",
                }}>
                    <span>⭐</span>
                    <span>{parseFloat(teacherRating).toFixed(1)}</span>
                </div>
            )}

            {/* Social media */}
            {showSocial && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.833vw" }}>

                <span style={{
                    fontFamily: "var(--font-base)", fontWeight: 400,
                    fontSize: "1.667vw", color: "var(--color-text-primary)", lineHeight: 1.25,
                }}>
                    My social media
                </span>

                {editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625vw", width: "100%" }}>
                        {SOCIAL_ICONS.map(s => (
                            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.625vw" }}>
                                <Image src={s.srcGray} alt={s.label} width={40} height={40}
                                    style={{ width: "2.08vw", height: "2.08vw", flexShrink: 0 }} />
                                <input
                                    type="url" placeholder={s.label}
                                    value={socialLinks[s.key]}
                                    onChange={e => onSocialChange(s.key, e.target.value)}
                                    style={{ ...INPUT_STYLE, flex: 1, minWidth: 0, width: "auto", fontSize: "0.833vw", padding: "0.26vw 0.52vw" }}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: "1.875vw" }}>
                        {SOCIAL_ICONS.map(s => {
                            const link = socialLinks[s.key];
                            const img = (
                                <Image key={s.key}
                                    src={link ? s.srcBlack : s.srcGray}
                                    alt={s.label} width={40} height={40}
                                    style={{ width: "2.08vw", height: "2.08vw", display: "block" }}
                                    unoptimized={!!link}
                                />
                            );
                            return link ? (
                                <a key={s.key} href={link} target="_blank" rel="noopener noreferrer"
                                    style={{ display: "inline-flex", lineHeight: 0 }}>
                                    {img}
                                </a>
                            ) : img;
                        })}
                    </div>
                )}
            </div>}

            {/* Edit / Cancel button */}
            {editing ? (
                <AccentButton size="md" onClick={onCancel} style={{ marginTop: "0.417vw" }} className="!bg-[var(--color-text-secondary)] hover:!bg-[var(--color-cancel-hover)]">
                    Cancel &amp; Exit
                </AccentButton>
            ) : (
                <AccentButton size="md" onClick={onEdit} style={{ marginTop: "0.417vw" }}>
                    Edit
                </AccentButton>
            )}
        </div>
    );
}
