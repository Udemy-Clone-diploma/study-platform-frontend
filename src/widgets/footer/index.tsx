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
                className="flex w-full max-w-[1420px] mx-auto flex-col items-center gap-8 px-4 pt-5 pb-5 md:px-6 xl:px-8 lg:flex-row lg:items-end lg:gap-0 lg:pt-10 lg:pb-10"
            >
                {/* Left */}
                <div
                    className="flex w-full flex-col items-center gap-8 lg:w-auto lg:items-stretch lg:justify-center lg:gap-[clamp(12px,1.67vw,32px)]"
                    style={{ flexBasis: "23.94%", flexShrink: 0, flexGrow: 0 }}
                >
                    <div className="w-full max-w-[340px] lg:max-w-none" style={{ aspectRatio: "340 / 114", position: "relative" }}>
                        <Image src="/logo/Nexo4u_logo3.svg" alt="Nexo4you" fill className="object-contain lg:object-left" />
                    </div>

                    <div className="flex w-full items-center justify-center gap-8 lg:w-auto lg:gap-[clamp(16px,1.875vw,36px)]">
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
                                    className="block h-10 w-10 object-contain lg:h-[clamp(20px,2.08vw,40px)] lg:w-[clamp(20px,2.08vw,40px)]"
                                />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:block" style={{ flexBasis: "9.86%", flexShrink: 0 }} />

                {/* Right */}
                <div
                    className="flex w-full flex-col items-center gap-8 lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:gap-[8%]"
                    style={{ minWidth: 0 }}
                >
                    <div className="flex w-full flex-col items-center gap-3 text-center lg:w-auto lg:flex-1 lg:min-w-0 lg:items-start lg:text-left">
                        {LINKS_LEFT.map((label) => (
                            <span key={label} className={textSizeClassName} style={textStyle}>{label}</span>
                        ))}
                    </div>

                    <div className="flex w-full flex-col items-center gap-3 text-center lg:w-auto lg:flex-1 lg:min-w-0 lg:items-start lg:text-left">
                        {LINKS_RIGHT.map((label) => (
                            <span key={label} className={textSizeClassName} style={textStyle}>{label}</span>
                        ))}
                    </div>

                    <div className="flex w-full flex-col items-center gap-3 text-center lg:w-auto lg:flex-1 lg:min-w-0 lg:items-start lg:text-left">
                        <FooterLink href="mailto:hello@gmail.com">hello@gmail.com</FooterLink>
                        <span className={textSizeClassName} style={textStyle}>24 New, Brooklyn, USA</span>
                        <span className={textSizeClassName} style={textStyle}>+34 875 328 58 47</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

const textSizeClassName = "text-[20px] lg:text-[clamp(13px,1.25vw,24px)]";

const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-base)",
    fontWeight: 400,
    lineHeight: 1.25,
    color: "var(--color-text-primary)",
    whiteSpace: "nowrap",
};

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a href={href} className={`transition-opacity hover:opacity-70 ${textSizeClassName}`} style={textStyle}>
            {children}
        </a>
    );
}
