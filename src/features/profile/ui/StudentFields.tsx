import { useLocale, useTranslations } from "next-intl";
import {
  ProfileField,
  ProfileLanguageField,
  LABEL_STYLE,
  VALUE_STYLE,
  TEXTAREA_STYLE,
  formatDate,
} from "./ProfileField";
import { AccentButton } from "@/shared/ui/AccentButton";
import { DatePicker, todayISO } from "@/shared/ui/DatePicker";
import type { StudentProfile, UserLanguage } from "@/entities/user";

const GRID_3_CLASS = "grid grid-cols-1 gap-y-5 gap-x-6 lg:grid-cols-3 lg:gap-[2.083vw_8.75vw]";

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
  editing,
  email,
  dateJoined,
  firstName,
  lastName,
  language,
  profile,
  dateOfBirth,
  learningGoals,
  onFirstNameChange,
  onLastNameChange,
  onLanguageChange,
  onDateOfBirthChange,
  onLearningGoalsChange,
  onChangePassword,
  onSave,
  saving,
}: Props) {
  const t = useTranslations("ProfileFields");
  const locale = useLocale();
  const dobDisplay = profile?.date_of_birth ? formatDate(profile.date_of_birth, locale) : "—";

  return (
    <div className="flex flex-col gap-5 lg:gap-[1.25vw]">
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
          <ProfileField label={t("email")} value={email} />
        </div>
        <div className="order-6 flex flex-col gap-1 lg:order-none lg:gap-[0.208vw]">
          <span style={LABEL_STYLE}>{t("dateOfBirth")}</span>
          {editing ? (
            <DatePicker
              size="md"
              max={todayISO()}
              value={dateOfBirth}
              onChange={onDateOfBirthChange}
            />
          ) : (
            <span style={VALUE_STYLE}>{dobDisplay}</span>
          )}
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
          <ProfileField label={t("dateOfRegistration")} value={formatDate(dateJoined, locale)} />
        </div>
        <div className="order-7 flex flex-col gap-1 lg:order-none lg:gap-[0.208vw]">
          <span style={LABEL_STYLE}>{t("learningGoals")}</span>
          {editing ? (
            <textarea
              value={learningGoals}
              onChange={(e) => onLearningGoalsChange(e.target.value)}
              rows={3}
              style={TEXTAREA_STYLE}
            />
          ) : (
            <span style={VALUE_STYLE}>{profile?.learning_goals || "—"}</span>
          )}
        </div>

        {/* Row 3 */}
        <div className="order-3 lg:order-none">
          <ProfileLanguageField
            value={language}
            inputValue={language}
            onInputChange={onLanguageChange}
          />
        </div>
        <div className="order-8 flex flex-col gap-1 lg:order-none lg:gap-[0.208vw]">
          <span style={{ ...LABEL_STYLE, visibility: editing ? "hidden" : "visible" }}>
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
        {editing && (
          <div className="order-9 flex items-end lg:order-none">
            <AccentButton size="md" onClick={onSave} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </AccentButton>
          </div>
        )}
      </div>
    </div>
  );
}
