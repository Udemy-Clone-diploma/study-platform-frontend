import Image from "next/image";
import Link from "next/link";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { GetStartedButton } from "@/shared/ui/GetStartedButton";

const TAGS = ["Skills", "Networking", "Growth"];

const PARTNERS = [
    { src: "/main/Clear Path Learning.png",  alt: "Clear Path Learning",  width: 195, height: 84 },
    { src: "/main/Next Step Academy.png",    alt: "Next Step Academy",    width: 188, height: 84 },
    { src: "/main/Skill Flow Studio.png",    alt: "Skill Flow Studio",    width: 238, height: 84 },
];

export function HeroSection() {
    return (
        <section style={{ position: "relative", overflow: "hidden" }}>


            {/* Decorative layer — anchored to content width, not viewport */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                maxWidth: 1480,
                marginLeft: "auto",
                marginRight: "auto",
                pointerEvents: "none",
            }}>
                {/* Blob right top */}
                <div style={{
                    position: "absolute",
                    width: 650,
                    height: 650,
                    right: "-10%",
                    top: "10%",
                    background: "radial-gradient(50% 50% at 50% 50%, rgba(255,244,218,0.72) 0%, rgba(252,196,195,0.72) 37%, rgba(167,186,250,0.72) 100%)",
                    filter: "blur(90px)",
                    borderRadius: "50%",
                }} />

                {/* Blob right center */}
                <div style={{
                    position: "absolute",
                    width: 541,
                    height: 541,
                    right: "20%",
                    top: "30%",
                    background: "radial-gradient(50% 50% at 50% 50%, rgba(255,244,218,0.72) 0%, rgba(252,196,195,0.72) 37%, rgba(167,186,250,0.72) 100%)",
                    filter: "blur(90px)",
                    borderRadius: "50%",
                }} />

                {/* Glitter texture */}
                <div style={{
                    position: "absolute",
                    top: "64%",
                    left: "64%",
                    width: "126%",
                    height: "126%",
                    backgroundImage: "url('/main/glitter-bg.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    transform: "translate(-50%, -50%)",
                    mixBlendMode: "lighten",
                    zIndex: 0,
                }} />
            </div>
           
            <SectionContainer style={{ paddingTop: "clamp(48px, 8vw, 128px)", paddingBottom: "clamp(48px, 5vw, 80px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "clamp(24px, 5%, 140px)" }}>
                    
                    {/* Left column */}
                    <div style={{ flex: "0 0 clamp(560px, 49%, 740px)", display: "flex", flexDirection: "column", gap: "clamp(32px, 4.2vw, 60px)", position: "relative", zIndex: 1 }}>

                        {/* Main content block */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 3.2vw, 46px)" }}>

                            {/* Tag + heading + rating */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.4vw, 20px)" }}>

                                {/* Tag pill */}
                                <div style={{
                                    display: "inline-flex",
                                    alignSelf: "flex-start",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: "0 10px",
                                    background: "var(--color-brand-lavender)",
                                    borderRadius: 4,
                                    height: 19,
                                }}>
                                    {TAGS.map((tag) => (
                                        <span key={tag} style={{
                                            fontFamily: "var(--font-accent)",
                                            fontWeight: 500,
                                            fontSize: 15,
                                            lineHeight: "19px",
                                            color: "var(--color-blue)",
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* H1 + subtitle */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.67vw, 24px)" }}>
                                    <h1 style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
                                        fontSize: "clamp(36px, 4.8vw, 72px)",
                                        lineHeight: 1.25,
                                        margin: 0,
                                        color: "var(--color-text-primary)",
                                    }}>
                                        Next-gen education
                                    </h1>
                                    <p style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
                                        fontSize: "clamp(16px, 1.67vw, 24px)",
                                        lineHeight: "1.25",
                                        color: "var(--color-text-primary)",
                                        margin: 0,
                                        maxWidth: 646,
                                    }}>
                                        A platform where knowledge turns into real-world results. Simple, flexible, and straight to the point.
                                    </p>
                                </div>

                                {/* Rating */}
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{
                                        display: "inline-flex",
                                        width: 36,
                                        height: 36,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#FDC43A">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </span>
                                    <span style={{
                                        fontFamily: "var(--font-base)",
                                        fontWeight: 400,
                                        fontSize: "clamp(14px, 1.39vw, 20px)",
                                        lineHeight: "25px",
                                        color: "var(--color-text-primary)",
                                    }}>
                                        4.9 rating from over 10,000 students
                                    </span>
                                </div>
                                
                            </div>

                            {/* Button */}
                           <GetStartedButton />
                        </div>

                        {/* Partners */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <p style={{
                                fontFamily: "var(--font-base)",
                                fontWeight: 400,
                                fontSize: "clamp(18px, 2.22vw, 32px)",
                                lineHeight: 1.25,
                                margin: 0,
                                color: "var(--color-text-primary)",
                            }}>
                                Verified by our partners
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 2.78vw, 40px)" }}>
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

                    {/* Right column — illustration */}
                    <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 2 }}>
                        <Image
                            src="/main/Image main.png"
                            alt=""
                            width={650}
                            height={651}
                            priority
                            style={{ width: "100%", maxWidth: 650, height: "auto" }}
                        />
                        
                    </div>
                    
                </div>
            </SectionContainer>
        
        </section>
    );
}
