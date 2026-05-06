import Image from "next/image";
import { cookies } from "next/headers";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { GetStartedButton } from "@/shared/ui/GetStartedButton";
import { ContinueLearningButton } from "@/shared/ui/ContinueLearningButton";

const TAGS = ["Skills", "Networking", "Growth"];

const PARTNERS = [
    { src: "/main/Clear Path Learning.png",  alt: "Clear Path Learning",  width: 195, height: 84 },
    { src: "/main/Next Step Academy.png",    alt: "Next Step Academy",    width: 188, height: 84 },
    { src: "/main/Skill Flow Studio.png",    alt: "Skill Flow Studio",    width: 238, height: 84 },
];

export async function HeroSection() {
    const jar = await cookies();
    const isLoggedIn = !!jar.get("access_token")?.value;

    return (
        <section style={{ position: "relative", overflow: "hidden" }}>
            <SectionContainer style={{paddingTop: "8vw", paddingBottom: "5vw" }}>
                <div style={{ width: "36.5vw", display: "flex", flexDirection: "column", gap: "4.2vw", position: "relative", zIndex: 1 }}>

                    {/* Main content block */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "3.2vw" }}>

                        {/* Tag + heading + rating */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.4vw" }}>

                            {/* Tag pill */}
                            <div style={{
                                display: "inline-flex",
                                alignSelf: "flex-start",
                                alignItems: "center",
                                gap: "0.83vw",
                                padding: "0 0.52vw",
                                background: "var(--color-brand-lavender)",
                                borderRadius: 4,
                                height: "0.99vw",
                            }}>
                                {TAGS.map((tag) => (
                                    <span key={tag} style={{
                                        fontFamily: "var(--font-accent)",
                                        fontWeight: 500,
                                        fontSize: "0.78vw",
                                        lineHeight: "0.99vw",
                                        color: "var(--color-blue)",
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* H1 + subtitle */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.67vw" }}>
                                <h1 style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "3.75vw",
                                    lineHeight: 1.25,
                                    margin: 0,
                                    color: "var(--color-text-primary)",
                                }}>
                                    Next-gen education
                                </h1>
                                <p style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "1.25vw",
                                    lineHeight: "1.25",
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                    maxWidth: "33.6vw",
                                }}>
                                    A platform where knowledge turns into real-world results. Simple, flexible, and straight to the point.
                                </p>
                            </div>

                            {/* Rating */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.42vw" }}>
                                <span style={{
                                    display: "inline-flex",
                                    width: "1.875vw",
                                    height: "1.875vw",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <svg width="1.25vw" height="1.25vw" viewBox="0 0 24 24" fill="var(--color-gold)" style={{ width: "1.25vw", height: "1.25vw" }}>
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </span>
                                <span style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "1.04vw",
                                    lineHeight: 1.25,
                                    color: "var(--color-text-primary)",
                                }}>
                                    4.9 rating from over 10,000 students
                                </span>
                            </div>

                        </div>

                        {/* Button */}
                        {isLoggedIn ? <ContinueLearningButton /> : <GetStartedButton />}
                    </div>

                    {/* Partners */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                        <p style={{
                            fontFamily: "var(--font-base)",
                            fontWeight: 400,
                            fontSize: "1.67vw",
                            lineHeight: 1.25,
                            margin: 0,
                            color: "var(--color-text-primary)",
                        }}>
                            Verified by our partners
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "2.08vw" }}>
                            {PARTNERS.map((p) => (
                                <div key={p.src} style={{ flex: `0 1 ${(p.width / 1920 * 100).toFixed(2)}vw`, minWidth: 0 }}>
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
