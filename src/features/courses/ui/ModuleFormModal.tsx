"use client";

import { useEffect, useRef, useState } from "react";
import { AccentButton } from "@/shared/ui/AccentButton";
import { GradientButton } from "@/shared/ui/GradientButton";

type Props = {
  mode: "add" | "edit";
  initialTitle?: string;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
};

/** Modal dialog for creating or renaming a course module. */
export function ModuleFormModal({ mode, initialTitle = "", onClose, onSave }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave(title.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--color-modal-overlay)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl"
        style={{
          width: "clamp(320px, 25vw, 420px)",
          padding: "clamp(20px, 1.56vw, 30px) clamp(24px, 1.82vw, 35px)",
          boxShadow: "var(--shadow-modal)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(18px, 1.04vw, 20px)",
            lineHeight: "25px",
            color: "var(--color-text-primary)",
            marginBottom: "clamp(14px, 1.04vw, 20px)",
          }}
        >
          {mode === "add" ? "Add Module" : "Edit Module"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Text"
            style={{
              display: "block",
              width: "100%",
              backgroundColor: "var(--color-input-bg)",
              border: "none",
              borderRadius: 10,
              padding: "clamp(10px, 0.73vw, 14px) clamp(12px, 0.83vw, 16px)",
              fontFamily: "var(--font-base)",
              fontWeight: 400,
              fontSize: "clamp(16px, 1.04vw, 20px)",
              lineHeight: "25px",
              color: "var(--color-text-primary)",
              outline: "none",
              marginBottom: "clamp(16px, 1.25vw, 24px)",
              boxSizing: "border-box",
            }}
          />

          {/* Buttons */}
          <div className="flex items-center justify-center" style={{ gap: 12 }}>
            <GradientButton
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                fontSize: "clamp(12px, 0.78vw, 15px)",
                height: "clamp(34px, 2.08vw, 40px)",
                background: "var(--color-draft)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancel
            </GradientButton>
            <AccentButton
              type="submit"
              size="sm"
              disabled={!title.trim() || loading}
              style={{ fontSize: "clamp(12px, 0.78vw, 15px)", height: "clamp(34px, 2.08vw, 40px)" }}
            >
              {loading ? "Saving…" : "Save"}
            </AccentButton>
          </div>
        </form>
      </div>
    </div>
  );
}
