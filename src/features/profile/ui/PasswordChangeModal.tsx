"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { changePassword } from "@/features/auth";
import { LABEL_STYLE } from "./ProfileField";

type Props = {
  onClose: () => void;
};

const LINE_INPUT: React.CSSProperties = {
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(14px, 1.04vw, 20px)",
  color: "var(--color-text-primary)",
  background: "transparent",
  border: "none",
  borderBottom: "1.5px solid var(--color-placeholder)",
  borderRadius: 0,
  outline: "none",
  width: "100%",
  padding: "clamp(6px, 0.417vw, 8px) clamp(24px, 2vw, 38px) clamp(6px, 0.417vw, 8px) 0",
};

/** Password change modal shown from the profile page. */
export function PasswordChangeModal({ onClose }: Props) {
  const t = useTranslations("PasswordChangeModal");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!oldPassword || !newPassword) {
      setError(t("errorBothFields"));
      return;
    }
    setSaving(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      onClose();
    } catch {
      setError(t("errorIncorrect"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} width="clamp(300px, 36vw, 520px)" maxHeight={undefined}>
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 1.667vw, 32px)" }}>
        {/* Old Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.625vw, 12px)" }}>
          <span style={LABEL_STYLE}>{t("oldPassword")}</span>
          <div style={{ position: "relative" }}>
            <input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={t("textPlaceholder")}
              style={LINE_INPUT}
            />
            <button
              type="button"
              onClick={() => setShowOld((v) => !v)}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "var(--color-text-secondary)",
              }}
              aria-label={showOld ? t("hidePassword") : t("showPassword")}
            >
              {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 0.625vw, 12px)" }}>
          <span style={LABEL_STYLE}>{t("newPassword")}</span>
          <div style={{ position: "relative" }}>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("textPlaceholder")}
              style={LINE_INPUT}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "var(--color-text-secondary)",
              }}
              aria-label={showNew ? t("hidePassword") : t("showPassword")}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(12px, 0.9vw, 17px)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </span>
        )}

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "0.417vw" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "var(--color-text-primary)",
              color: "var(--color-bg)",
              fontFamily: "var(--font-base)",
              fontWeight: 700,
              fontSize: "clamp(13px, 1.04vw, 20px)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "6.25vw",
              padding: "clamp(10px, 0.625vw, 12px) clamp(28px, 3.125vw, 60px)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
