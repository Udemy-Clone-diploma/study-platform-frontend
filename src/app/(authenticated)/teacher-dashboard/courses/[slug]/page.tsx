"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccentButton } from "@/shared/ui/AccentButton";

export default function CourseManagementPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  return (
    <main
      className="bg-my-courses min-h-[calc(100vh-76px)] flex flex-col items-center justify-center"
      style={{ paddingInline: "clamp(16px, 2.78vw, 40px)", paddingBlock: "clamp(16px, 2.22vw, 32px)" }}
    >
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(12px, 1.39vw, 20px)" }}>
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 700,
            fontSize: "clamp(48px, 6.94vw, 100px)",
            lineHeight: 1,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Coming Soon
        </p>
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 1.11vw, 16px)",
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          Course management for{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{slug}</strong>
          {" "}is under construction.
        </p>
        <AccentButton
          type="button"
          size="md"
          style={{ gap: 8, marginTop: 8 }}
          onClick={() => router.push("/teacher-dashboard/courses")}
        >
          <ArrowLeft size={18} />
          Back to my courses
        </AccentButton>
      </div>
    </main>
  );
}
