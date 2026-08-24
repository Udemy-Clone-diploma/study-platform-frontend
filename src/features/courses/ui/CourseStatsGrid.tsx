type Stat = { icon: string; count: number; label: string };

/** 4-column stats row shown on course review pages (modules / lessons / tests / minutes). */
export function CourseStatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
      {stats.map(({ icon, count, label }) => (
        <div
          key={label}
          style={{
            border: "1px solid var(--color-draft)",
            borderRadius: 16,
            height: "clamp(90px, 6.875vw, 132px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            style={{ width: "clamp(24px, 2.08vw, 40px)", height: "clamp(24px, 2.08vw, 40px)" }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 700,
                fontSize: "clamp(14px, 1.04vw, 20px)",
                textAlign: "center",
              }}
            >
              {count}
            </span>
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 500,
                fontSize: "clamp(11px, 0.78vw, 15px)",
                color: "var(--color-text-secondary)",
                textAlign: "center",
              }}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
