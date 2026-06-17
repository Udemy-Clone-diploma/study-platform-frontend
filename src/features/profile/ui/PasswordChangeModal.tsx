"use client";

import { useState } from "react";
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
    fontSize: "1.04vw",
    color: "var(--color-text-primary)",
    background: "transparent",
    border: "none",
    borderBottom: "1.5px solid var(--color-placeholder)",
    borderRadius: 0,
    outline: "none",
    width: "100%",
    padding: "0.417vw 2vw 0.417vw 0",
};

/** Password change modal shown from the profile page. */
export function PasswordChangeModal({ onClose }: Props) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        setError(null);
        if (!oldPassword || !newPassword) {
            setError("Please fill in both fields.");
            return;
        }
        setSaving(true);
        try {
            await changePassword({ old_password: oldPassword, new_password: newPassword });
            onClose();
        } catch {
            setError("Incorrect current password or invalid new password.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell onClose={onClose} width="clamp(300px, 36vw, 520px)" maxHeight={undefined}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.667vw" }}>

                {/* Old Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625vw" }}>
                    <span style={LABEL_STYLE}>Old Password</span>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showOld ? "text" : "password"}
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            placeholder="Text"
                            style={LINE_INPUT}
                        />
                        <button
                            type="button"
                            onClick={() => setShowOld(v => !v)}
                            style={{
                                position: "absolute", right: 0, top: "50%",
                                transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer", padding: 0,
                                display: "flex", alignItems: "center",
                                color: "var(--color-text-secondary)",
                            }}
                            aria-label={showOld ? "Hide password" : "Show password"}
                        >
                            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625vw" }}>
                    <span style={LABEL_STYLE}>New Password</span>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Text"
                            style={LINE_INPUT}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(v => !v)}
                            style={{
                                position: "absolute", right: 0, top: "50%",
                                transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer", padding: 0,
                                display: "flex", alignItems: "center",
                                color: "var(--color-text-secondary)",
                            }}
                            aria-label={showNew ? "Hide password" : "Show password"}
                        >
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <span style={{
                        fontFamily: "var(--font-base)", fontSize: "0.9vw",
                        color: "var(--color-danger)",
                    }}>
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
                            fontSize: "1.04vw",
                            letterSpacing: "0.08em",
                            border: "none",
                            borderRadius: "6.25vw",
                            padding: "0.625vw 3.125vw",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.7 : 1,
                            transition: "opacity 0.2s",
                        }}
                    >
                        {saving ? "Saving..." : "SAVE"}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
