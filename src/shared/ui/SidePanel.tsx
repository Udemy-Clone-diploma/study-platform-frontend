"use client";

import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  /** Distance from top edge of nearest `position: relative` ancestor. */
  top?: string | number;
  /** Distance from right edge. Defaults to match typical page inline padding. */
  right?: string | number;
  /** Distance from bottom edge. */
  bottom?: string | number;
  borderRadius?: string | number;
  borderLeft?: string;
  zIndex?: number;
  children: React.ReactNode;
};

/** Sliding overlay panel that animates in from the right.
 *  Requires a `position: relative` ancestor to scope the absolute positioning. */
export function SidePanel({
  open,
  onClose,
  title,
  width = "clamp(280px, 24vw, 400px)",
  top = "clamp(12px, 1.25vw, 20px)",
  right = "clamp(12px, 1.25vw, 20px)",
  bottom = "clamp(12px, 1.25vw, 20px)",
  borderRadius = "clamp(12px, 1vw, 20px)",
  borderLeft,
  zIndex = 20,
  children,
}: Props) {
  return (
    <div
      aria-hidden={!open}
      style={{
        position: "absolute",
        top,
        right,
        bottom,
        width,
        background: "var(--color-bg)",
        borderRadius,
        borderLeft,
        boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
        zIndex,
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transform: open ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      <div style={{
        height: "100%",
        overflowY: "auto",
        padding: "clamp(16px, 1.25vw, 24px)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(14px, 1vw, 17px)",
            color: "var(--color-text-primary)",
            margin: 0,
          }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              padding: 4,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
