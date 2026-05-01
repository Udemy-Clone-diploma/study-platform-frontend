import Image from "next/image";

const SOCIAL = [
    { name: "Instagram", src: "/social-media-icons/instagrm.png", href: "https://instagram.com" },
    { name: "Google",    src: "/social-media-icons/Google.png",    href: "https://google.com" },
    { name: "Behance",   src: "/social-media-icons/behance.png",   href: "https://behance.net" },
    { name: "LinkedIn",  src: "/social-media-icons/LinKedln.png",  href: "https://linkedin.com" },
    { name: "Facebook",  src: "/social-media-icons/Facebook.png",  href: "https://facebook.com" },
];

const LINKS_LEFT  = ["Business", "Languages", "Personal development"];
const LINKS_RIGHT = ["Design", "Programming", "Marketing"];

export function Footer() {
    return (
        <footer
            className="w-full shrink-0"
            style={{
                backgroundImage: "url('/backgrounds/footer-bg-image.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "20px 20px 0 0",
                overflowX: "clip",
            }}
        >
            <div
                className="w-full max-w-[1420px] mx-auto px-4 md:px-6 xl:px-8"
                style={{
                    paddingTop: 40,
                    paddingBottom: 40,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                }}
            >
                {/* Left */}
                <div
                    style={{
                        flexBasis: "23.94%",
                        flexShrink: 0,
                        flexGrow: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "clamp(12px, 1.67vw, 32px)",
                    }}
                >
                    <div style={{ width: "100%", aspectRatio: "340 / 114", background: "var(--color-placeholder)" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 1.875vw, 36px)" }}>
                        {SOCIAL.map((s) => (
                            <a
                                key={s.name}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.name}
                                className="shrink-0 transition-opacity hover:opacity-70"
                            >
                                <Image
                                    src={s.src}
                                    alt={s.name}
                                    width={40}
                                    height={40}
                                    className="block object-contain"
                                    style={{ width: "clamp(20px, 2.08vw, 40px)", height: "clamp(20px, 2.08vw, 40px)" }}
                                />
                            </a>
                        ))}
                    </div>
                </div>

                <div style={{ flexBasis: "9.86%", flexShrink: 0 }} />

                {/* Right */}
                <div
                    style={{
                        flex: "1 1 0",
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "8%",
                    }}
                >
                    <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 12 }}>
                        {LINKS_LEFT.map((label) => (
                            <span key={label} style={textStyle}>{label}</span>
                        ))}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 12 }}>
                        {LINKS_RIGHT.map((label) => (
                            <span key={label} style={textStyle}>{label}</span>
                        ))}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 12 }}>
                        <FooterLink href="mailto:hello@gmail.com">hello@gmail.com</FooterLink>
                        <span style={textStyle}>24 New, Brooklyn, USA</span>
                        <span style={textStyle}>+34 875 328 58 47</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontSize: "clamp(13px, 1.25vw, 24px)",
    fontWeight: 400,
    lineHeight: 1.25,
    color: "var(--color-text-primary)",
    whiteSpace: "nowrap",
};

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a href={href} className="transition-opacity hover:opacity-70" style={textStyle}>
            {children}
        </a>
    );
}
