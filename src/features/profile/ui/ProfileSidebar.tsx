"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";
import type { UserData } from "@/entities/user";
import { PROFILE_SOCIALS, type SocialLinks } from "../model/socialLinks";
import { PILL_BTN_MOBILE_CLASS } from "./ProfileField";

export { PROFILE_SOCIALS as SOCIAL_ICONS } from "../model/socialLinks";
export type { SocialLinks } from "../model/socialLinks";

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
    const t = useTranslations("ProfileSidebar");
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    const fileRef = useRef<HTMLInputElement>(null);

    const avatarSrc = avatarPreview ?? user.avatar ?? null;

    return (
        <div
            className="flex w-full shrink-0 flex-col items-center gap-5 px-4 pt-4 pb-4 lg:w-[22.14vw] lg:items-center lg:gap-[1.25vw] lg:self-start lg:px-[1.5vw] lg:pt-[4.17vw] lg:pb-[6.25vw]"
        >
            {/* Avatar */}
            <div
                onClick={editing ? () => fileRef.current?.click() : undefined}
                className="relative h-60 w-60 shrink-0 overflow-hidden rounded-full lg:h-[12.5vw] lg:w-[12.5vw]"
                style={{
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
                        color: "var(--color-bg)", fontSize: "clamp(24px, 3vw, 58px)", fontWeight: 700,
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
                        color: "var(--color-bg)", fontSize: "clamp(11px, 0.833vw, 16px)", fontWeight: 600,
                        fontFamily: "var(--font-base)", textAlign: "center",
                        lineHeight: 1.3,
                    }}>
                        {t("changePhoto")}
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
                fontSize: "clamp(32px, 2.083vw, 40px)", color: "var(--color-text-primary)",
                textAlign: "center", lineHeight: 1.25, letterSpacing: "-0.011em",
            }}>
                {fullName || "—"}
            </div>

            {/* Teacher rating */}
            {teacherRating && parseFloat(teacherRating) > 0 && (
                <div className="flex items-center gap-2 lg:gap-[0.417vw]" style={{
                    fontFamily: "var(--font-base)", fontWeight: 600,
                    fontSize: "clamp(20px, 1.25vw, 24px)", color: "var(--color-text-primary)",
                }}>
                    <Star aria-hidden className="h-6 w-6 fill-(--color-gold) text-(--color-gold) lg:h-[1.25vw] lg:w-[1.25vw]" />
                    <span>{parseFloat(teacherRating).toFixed(1)}</span>
                </div>
            )}

            {/* Social media */}
            {showSocial && <div className="flex w-full flex-col items-center gap-3 lg:gap-[0.833vw]">

                <span style={{
                    fontFamily: "var(--font-base)", fontWeight: 400,
                    fontSize: "clamp(20px, 1.667vw, 32px)", color: "var(--color-text-primary)", lineHeight: 1.25,
                }}>
                    {t("mySocialMedia")}
                </span>

                {editing ? (
                    <div className="flex w-[277px] max-w-full flex-col gap-4 lg:w-full lg:gap-[0.833vw]">
                        {PROFILE_SOCIALS.map(s => (
                            <div key={s.key} className="flex h-[46px] items-center gap-2.5 rounded-full border px-5 lg:h-auto lg:gap-[0.625vw] lg:px-[1.042vw] lg:py-[0.417vw]" style={{
                                background: "var(--color-bg)",
                                borderColor: "var(--color-text-primary)",
                            }}>
                                <Image src={s.srcBlack} alt={s.label} width={32} height={32}
                                    className="h-8 w-8 shrink-0 lg:h-[1.458vw] lg:w-[1.458vw]"
                                    style={{ display: "block" }}
                                    unoptimized />
                                <input
                                    type="url" placeholder={s.label}
                                    value={socialLinks[s.key]}
                                    onChange={e => onSocialChange(s.key, e.target.value)}
                                    className="min-w-0 flex-1 border-none bg-transparent outline-none"
                                    style={{
                                        fontFamily: "var(--font-base)", fontWeight: 400,
                                        fontSize: "clamp(16px, 0.938vw, 18px)", color: "var(--color-text-secondary)",
                                        letterSpacing: "-0.011em",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-9 lg:gap-[1.875vw]">
                        {PROFILE_SOCIALS.map(s => {
                            const link = socialLinks[s.key];
                            const img = (
                                <Image key={s.key}
                                    src={link ? s.srcBlack : s.srcGray}
                                    alt={s.label} width={40} height={40}
                                    className="block h-10 w-10 lg:h-[2.08vw] lg:w-[2.08vw]"
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
                <AccentButton size="md" onClick={onCancel} className={`mt-3 lg:mt-[0.417vw] ${PILL_BTN_MOBILE_CLASS} !bg-[var(--color-text-secondary)] hover:!bg-[var(--color-cancel-hover)]`}>
                    {t("cancelAndExit")}
                </AccentButton>
            ) : (
                <AccentButton size="md" onClick={onEdit} className={`mt-3 lg:mt-[0.417vw] ${PILL_BTN_MOBILE_CLASS}`}>
                    {t("edit")}
                </AccentButton>
            )}
        </div>
    );
}
