import { getTranslations } from "next-intl/server";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { UspCard } from "@/shared/ui/UspCard";

const USP_KEYS = ["accessibility", "connect", "result"] as const;

export async function PlatformBenefitsSection() {
  const t = await getTranslations("HomeBenefits");
  const TAGS = t.raw("tags") as string[];
  const USP_CARDS = USP_KEYS.map((key) => ({
    title: t(`cards.${key}.title`),
    description: t(`cards.${key}.description`),
  }));

  return (
    <section
      style={{
        backgroundImage: "url(/backgrounds/mainpage-sec4-background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <SectionContainer style={{ paddingBottom: "6.25vw" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(40px, 8.33vw, 120px)",
            paddingTop: "6.25vw",
            paddingBottom: "6.25vw",
          }}
        >
          {/* Row 1: heading + tags (left) / description (right) — stacks below 1024px */}
          <div
            className="flex flex-col lg:flex-row lg:items-center"
            style={{ gap: "clamp(20px, 7.29vw, 105px)" }}
          >
            {/* Left column */}
            <div
              className="w-full lg:w-[30.21vw]"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(10px, 1.04vw, 15px)",
                flexShrink: 0,
              }}
            >
              <h2
                className="text-[28px] md:text-[36px] lg:text-[2.5vw]"
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 400,
                  lineHeight: 1.25,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {t("heading")}
              </h2>

              {/* Tag pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  alignItems: "center",
                  padding: "3px clamp(6px, 0.52vw, 8px)",
                  background: "var(--color-badge-lavender)",
                  borderRadius: 4,
                }}
              >
                <div
                  className="flex flex-row flex-wrap items-center"
                  style={{ gap: "clamp(8px, 0.83vw, 12px)" }}
                >
                  {TAGS.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] leading-[14px] md:text-[12px] md:leading-[15px] lg:text-[0.78vw] lg:leading-[0.99vw]"
                      style={{
                        fontFamily: "var(--font-accent)",
                        fontWeight: 500,
                        color: "var(--color-blue)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: description */}
            <p
              className="text-[15px] md:text-[17px] lg:text-[1.04vw]"
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 400,
                lineHeight: 1.25,
                color: "var(--color-text-primary)",
                margin: 0,
                flex: 1,
              }}
            >
              {t("description")}
            </p>
          </div>

          {/* Row 2: USP glass cards — stacks below 1024px */}
          <div
            className="flex flex-col items-stretch lg:flex-row"
            style={{ gap: "clamp(16px, 1.04vw, 15px)" }}
          >
            {USP_CARDS.map((card) => (
              <UspCard key={card.title} title={card.title} description={card.description} />
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
