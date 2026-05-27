const STEPS = [
  { name: "Basics", sub: "Course information" },
  { name: "Course Content", sub: "Modules, lessons & tests" },
  { name: "Review & Publish", sub: "Launch course" },
];

const ACTIVE_COLORS: { bg: string; text: string }[] = [
  { bg: "var(--color-brand-pink)",     text: "var(--color-pink-dark)" },
  { bg: "var(--color-brand-lavender)", text: "var(--color-blue)" },
  { bg: "var(--color-brand-cream)",    text: "var(--color-pink-dark)" },
];

const DONE_COLORS = {
  bg: "var(--color-brand-pink)",
  text: "var(--color-pink-dark)",
};

type Props = { currentStep: 0 | 1 | 2 };

/** 3-step progress indicator shared by all course-creation pages. */
export function CourseCreationStepper({ currentStep }: Props) {
  return (
    <div
      className="rounded-2xl bg-white"
      style={{
        padding: "clamp(20px, 1.82vw, 35px) clamp(24px, 2.6vw, 50px)",
        marginBottom: "clamp(12px, 1.25vw, 24px)",
        boxShadow: "0px 0px 17px rgba(0, 0, 0, 0.16)",
      }}
    >
      <div className="flex items-start justify-between">
        {STEPS.map((step, i) => {
          const isDone   = i < currentStep;
          const isActive = i === currentStep;
          const colors   = isActive ? ACTIVE_COLORS[i] : isDone ? DONE_COLORS : null;

          return (
            <div key={step.name} className="flex flex-col items-center" style={{ gap: "8px" }}>
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width:  "clamp(32px, 2.08vw, 40px)",
                  height: "clamp(32px, 2.08vw, 40px)",
                  background: colors ? colors.bg : "transparent",
                  border: colors ? "none" : "1px solid var(--color-text-secondary)",
                  fontFamily:  "var(--font-accent)",
                  fontWeight:  700,
                  fontSize:    "clamp(12px, 0.83vw, 16px)",
                  color: colors ? colors.text : "var(--color-text-secondary)",
                }}
              >
                {i + 1}
              </div>

              <div className="flex flex-col items-center" style={{ gap: "2px" }}>
                <span
                  style={{
                    fontFamily:  "var(--font-accent)",
                    fontWeight:  700,
                    fontSize:    "clamp(11px, 0.83vw, 16px)",
                    color: colors ? colors.text : "var(--color-text-secondary)",
                    whiteSpace:  "nowrap",
                  }}
                >
                  {step.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 500,
                    fontSize:   "clamp(10px, 0.73vw, 14px)",
                    color:      "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
