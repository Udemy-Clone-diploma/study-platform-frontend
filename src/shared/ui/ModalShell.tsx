"use client";

import { X } from "lucide-react";

type Props = {
  onClose: () => void;
  /** If provided, renders a header row: icon + title + X close button. */
  title?: string;
  icon?: React.ReactNode;
  width?: string;
  padding?: string;
  shadow?: string;
  /** Enables vertical scroll inside the card (default: "90vh"). Pass undefined to disable. */
  maxHeight?: string;
  children: React.ReactNode;
};

/** Shared modal wrapper — overlay backdrop + white rounded card + optional header. */
export function ModalShell({
  onClose,
  title,
  icon,
  width = "clamp(480px, 81.39vw, 1200px)",
  padding = "clamp(20px, 2.78vw, 40px) clamp(24px, 3.47vw, 50px)",
  shadow = "var(--shadow-dashboard-card)",
  maxHeight = "90vh",
  children,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--color-modal-overlay)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl"
        style={{
          width,
          padding,
          boxShadow: shadow,
          ...(maxHeight ? { maxHeight, overflowY: "auto" as const } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: "clamp(20px, 2.22vw, 32px)" }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              {icon}
              <h2
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 700,
                  fontSize: "clamp(16px, 1.39vw, 20px)",
                  lineHeight: "25px",
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-full transition hover:bg-gray-100"
              style={{ width: 32, height: 32, background: "transparent", border: "none", cursor: "pointer", flexShrink: 0 }}
              aria-label="Close"
            >
              <X size={20} style={{ color: "var(--color-text-primary)" }} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
