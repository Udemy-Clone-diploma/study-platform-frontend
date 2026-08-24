"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ProfileField,
  ProfileLanguageField,
  ProfileInstructionLanguageField,
  LABEL_STYLE,
  VALUE_STYLE,
  TEXTAREA_STYLE,
  FIELD_GAP,
  formatDate,
} from "./ProfileField";
import type { TeacherProfile, UserLanguage } from "@/entities/user";

const GRID_3_CLASS = "grid grid-cols-1 gap-y-6 gap-x-6 lg:grid-cols-3 lg:gap-[2.083vw_8.75vw]";

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
  editing,
  email,
  dateJoined,
  firstName,
  lastName,
  language,
  instructionLanguage,
  profile,
  specialization,
  experience,
  bio,
  yearsExperience,
  partnershipsCount,
  signaturePreview,
  onSignatureChange,
  onFirstNameChange,
  onLastNameChange,
  onLanguageChange,
  onInstructionLanguageChange,
  onSpecializationChange,
  onExperienceChange,
  onBioChange,
  onYearsExperienceChange,
  onPartnershipsCountChange,
  onChangePassword,
}: Props) {
  const t = useTranslations("ProfileFields");
  const locale = useLocale();
  const signatureFileRef = useRef<HTMLInputElement>(null);
  const signatureSrc = signaturePreview ?? profile?.signature ?? null;

  return (
    <div className="flex flex-col gap-5 lg:gap-[1.25vw]">
      {/* 3-column grid */}
      <div className={GRID_3_CLASS}>
        {/* Row 1 */}
        <div className="order-1 lg:order-none">
          <ProfileField
            label={t("firstName")}
            value={firstName}
            editing={editing}
            inputValue={firstName}
            onInputChange={onFirstNameChange}
          />
        </div>
        <div className="order-4 lg:order-none">
          <ProfileField
            label={t("fieldOfStudy")}
            value={profile?.specialization || "—"}
            editing={editing}
            inputValue={specialization}
            onInputChange={onSpecializationChange}
          />
        </div>
        <div className="order-7 lg:order-none">
          <ProfileField label={t("email")} value={email} />
        </div>

        {/* Row 2 */}
        <div className="order-2 lg:order-none">
          <ProfileField
            label={t("lastName")}
            value={lastName}
            editing={editing}
            inputValue={lastName}
            onInputChange={onLastNameChange}
          />
        </div>
        <div className="order-5 lg:order-none">
          <ProfileInstructionLanguageField
            editing={editing}
            value={instructionLanguage}
            inputValue={instructionLanguage}
            onInputChange={onInstructionLanguageChange}
          />
        </div>
        <div className="order-8 lg:order-none">
          <ProfileField label={t("dateOfRegistration")} value={formatDate(dateJoined, locale)} />
        </div>

        {/* Row 3 */}
        <div className="order-3 lg:order-none">
          <ProfileField
            label={t("workExperience")}
            value={profile?.experience || "—"}
            editing={editing}
            inputValue={experience}
            onInputChange={onExperienceChange}
          />
        </div>
        <div className="order-6 lg:order-none">
          <ProfileLanguageField
            value={language}
            inputValue={language}
            onInputChange={onLanguageChange}
          />
        </div>

        {/* Password cell */}
        <div className="order-9 flex flex-col gap-1 lg:order-none lg:gap-[0.208vw]">
          {/* While editing the label is only a spacer keeping the desktop grid row aligned; on mobile it would just be dead space. */}
          <span
            className={editing ? "max-lg:hidden" : undefined}
            style={{ ...LABEL_STYLE, visibility: editing ? "hidden" : "visible" }}
          >
            {t("password")}
          </span>
          {editing ? (
            <button
              type="button"
              onClick={onChangePassword}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "var(--font-base)",
                fontWeight: 600,
                fontSize: "clamp(20px, 1.25vw, 24px)",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.5,
                letterSpacing: "-0.011em",
              }}
            >
              {t("changePassword")}
            </button>
          ) : (
            <span style={VALUE_STYLE}>••••••••••••••</span>
          )}
        </div>

        {/* Row 4 — optional course-detail instructor-card stats. Shown there only if set. */}
        <div className="order-10 lg:order-none">
          <ProfileField
            label={t("yearsOfExperienceOptional")}
            value={profile?.years_experience != null ? String(profile.years_experience) : "—"}
            editing={editing}
            inputValue={yearsExperience}
            onInputChange={onYearsExperienceChange}
          />
        </div>
        <div className="order-11 lg:order-none">
          <ProfileField
            label={t("partnershipsOptional")}
            value={profile?.partnerships_count != null ? String(profile.partnerships_count) : "—"}
            editing={editing}
            inputValue={partnershipsCount}
            onInputChange={onPartnershipsCountChange}
          />
        </div>
      </div>

      {/* Bio — full width below the grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: FIELD_GAP }}>
        <span style={LABEL_STYLE}>{t("bio")}</span>
        {editing ? (
          <textarea
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            rows={4}
            style={TEXTAREA_STYLE}
          />
        ) : (
          <span style={VALUE_STYLE}>{profile?.bio || "—"}</span>
        )}
      </div>

      {/* Signature — drawn onto generated course certificates */}
      <div style={{ display: "flex", flexDirection: "column", gap: FIELD_GAP }}>
        <span style={LABEL_STYLE}>{t("signature")}</span>
        <p
          style={{
            ...VALUE_STYLE,
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          {t("signatureRequired")}
        </p>
        <div
          onClick={editing ? () => signatureFileRef.current?.click() : undefined}
          className="w-[220px] max-w-full lg:w-[12vw]"
          style={{
            height: "clamp(72px, 5vw, 96px)",
            borderRadius: 12,
            border: "1px dashed var(--color-border-light)",
            background: "var(--color-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: editing ? "pointer" : "default",
            overflow: "hidden",
          }}
        >
          {signatureSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signatureSrc}
              alt={t("signature")}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <span
              style={{
                ...VALUE_STYLE,
                fontWeight: 400,
                color: "var(--color-text-muted)",
                fontSize: "clamp(12px, 0.9vw, 17px)",
              }}
            >
              {editing ? t("clickToUpload") : t("notUploaded")}
            </span>
          )}
        </div>
        <input
          ref={signatureFileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSignatureChange(file);
          }}
        />
      </div>
    </div>
  );
}
