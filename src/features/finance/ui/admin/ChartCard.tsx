"use client";

import type { ReactNode } from "react";

export function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 flex-col rounded-2xl bg-white"
      style={{
        padding: "clamp(16px, 1.39vw, 24px)",
        gap: "clamp(12px, 1.11vw, 16px)",
        boxShadow: "var(--shadow-dashboard-card)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="font-bold text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(15px, 1.25vw, 18px)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ChartMessage({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <p
      className={tone === "error" ? "text-(--color-danger)" : "text-(--color-text-secondary)"}
      style={{
        fontFamily: "var(--font-base)",
        fontSize: "clamp(12px, 0.97vw, 14px)",
        minHeight: "clamp(180px, 16vw, 230px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
