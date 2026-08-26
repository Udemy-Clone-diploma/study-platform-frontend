import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getMe, type UserRole } from "@/entities/user";
import {
    getAccessToken,
    getUserRoleCookie,
    hasUsableRefreshToken,
} from "@/shared/api/authCookies";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { AccentButton } from "@/shared/ui/AccentButton";
import { ramp, fluid3 } from "@/shared/lib/fluidScale";

const PARTNERS = [
  { src: "/main/Clear Path Learning.png", alt: "Clear Path Learning", width: 195, height: 84 },
  { src: "/main/Next Step Academy.png", alt: "Next Step Academy", width: 188, height: 84 },
  { src: "/main/Skill Flow Studio.png", alt: "Skill Flow Studio", width: 238, height: 84 },
];

const heroButtonStyle = {
  height: fluid3(375, 40, 1024, 50, 1920, 52),
  fontSize: `clamp(16px, ${ramp(375, 16, 1024, 20)}, 20px)`,
  padding: `0 ${fluid3(375, 20, 1024, 27, 1920, 28)}`,
};

export async function HeroSection() {
  const [accessToken, roleCookie, hasRefreshSession] = await Promise.all([
    getAccessToken(),
    getUserRoleCookie(),
    hasUsableRefreshToken(),
  ]);
  const user = accessToken ? await getMe(accessToken).catch(() => null) : null;
  const role = user?.role ?? (roleCookie as UserRole | undefined) ?? null;
  const isLoggedIn = Boolean(user || (role && hasRefreshSession));
  const isTeacher = role === "teacher";
  const t = await getTranslations("HomeHero");
  const tCommon = await getTranslations("Common");
  const TAGS = t.raw("tags") as string[];

  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <SectionContainer style={{ paddingTop: "8vw", paddingBottom: "5vw" }}>
        <div
          className="w-full min-[1024px]:max-[1439px]:w-[max(420px,36.5vw)] min-[1440px]:w-[max(600px,36.5vw)]"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(24px, 4.2vw, 60px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "clamp(20px, 3.2vw, 46px)" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.4vw, 20px)" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  alignItems: "center",
                  gap: "clamp(8px, 0.83vw, 12px)",
                  padding: "3px clamp(6px, 0.52vw, 8px)",
                  background: "var(--color-brand-lavender)",
                  borderRadius: 4,
                }}
              >
                {TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] leading-[14px] md:text-[12px] md:leading-[15px] lg:text-[0.78vw] lg:leading-[0.99vw]"
                    style={{
                      fontFamily: "var(--font-accent)",
                      fontWeight: 500,
                      color: "var(--color-blue)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(12px, 1.67vw, 24px)",
                }}
              >
                <h1
                  className="text-[32px] md:text-[42px] lg:text-[3.75vw]"
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    margin: 0,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {t("title")}
                </h1>
                <p
                  className="text-[15px] md:text-[18px] lg:text-[1.25vw]"
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    lineHeight: "1.25",
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {t("subtitle")}
                </p>
              </div>

              <div
                className="flex items-center justify-center lg:justify-start"
                style={{ gap: "clamp(6px, 0.42vw, 8px)" }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: "clamp(24px, 1.875vw, 27px)",
                    height: "clamp(24px, 1.875vw, 27px)",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="var(--color-gold)"
                    style={{
                      width: "clamp(16px, 1.25vw, 18px)",
                      height: "clamp(16px, 1.25vw, 18px)",
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <span
                  className="text-[13px] md:text-[15px] lg:text-[1.04vw]"
                  style={{
                    fontFamily: "var(--font-base)",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {t("rating")}
                </span>
              </div>
            </div>

            {!isTeacher && (
              <div className="self-center lg:self-start">
                {isLoggedIn ? (
                  <AccentButton href="/student-dashboard/courses" size="md" style={heroButtonStyle}>
                    {t("continueLearning")}
                  </AccentButton>
                ) : (
                  <AccentButton href="/login" size="md" style={heroButtonStyle}>
                    {tCommon("getStarted")}
                  </AccentButton>
                )}
              </div>
            )}
          </div>

          <div
            className="items-center lg:items-start"
            style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.04vw, 15px)" }}
          >
            <p
              className="text-center text-[16px] md:text-[20px] lg:text-left lg:text-[1.67vw]"
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 400,
                lineHeight: 1.25,
                margin: 0,
                color: "var(--color-text-primary)",
              }}
            >
              {t("verifiedByPartners")}
            </p>
            <div
              className="flex w-full flex-nowrap items-center justify-center lg:justify-start"
              style={{ gap: "clamp(10px, 2.08vw, 30px)" }}
            >
              {PARTNERS.map((p) => (
                <div key={p.src} style={{ flex: `0 1 ${p.width}px`, minWidth: 0 }}>
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
