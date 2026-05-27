"use client";

type Props = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
};

/** White card wrapper for the Course Basics step — title, subtitle, and form slot. */
export function CourseBasicsCard({ onSubmit, children }: Props) {
  return (
    <div
      className="rounded-2xl bg-white"
      style={{
        padding: "clamp(24px, 2.08vw, 40px) clamp(24px, 2.6vw, 50px)",
        boxShadow: "var(--shadow-dashboard-card)",
      }}
    >
      <h2
        className="font-bold font-(family-name:--font-base) text-(--color-text-primary)"
        style={{ fontSize: "clamp(20px, 1.875vw, 36px)", marginBottom: "clamp(4px, 0.42vw, 8px)" }}
      >
        Course Basics
      </h2>
      <p
        className="font-medium font-(family-name:--font-base) text-(--color-text-secondary)"
        style={{ fontSize: "clamp(13px, 1.04vw, 20px)", letterSpacing: "-0.011em", marginBottom: "clamp(16px, 1.56vw, 24px)" }}
      >
        Set up the fundamental information about your course
      </p>
      <form onSubmit={onSubmit}>{children}</form>
    </div>
  );
}
