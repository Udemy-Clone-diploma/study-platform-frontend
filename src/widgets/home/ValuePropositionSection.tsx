import { SectionContainer } from "@/shared/ui/SectionContainer";
import { UspCard } from "@/shared/ui/UspCard";

const TAGS = ["Upgrade", "Hands-on", "Flow", "Validated", "Pro"];

const USP_CARDS = [
    {
        title: "Accessibility",
        description:
            "Education that fits your budget. Pay in full or choose a comfortable installment plan. Track your entire payment schedule directly in your dashboard.",
    },
    {
        title: "Connect",
        description:
            "More than just video lectures. Engage in private or group chats with peers and mentors. Ask questions about any lesson with a single click.",
    },
    {
        title: "Result",
        description:
            "Your skill is your currency. Complete tests, earn scores, and download your official PDF certificate. Build your career with verified expertise.",
    },
];

export function ValuePropositionSection() {
    return (
        <section
            style={{
                backgroundImage: "url(/backgrounds/mainpage-sec4-background.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* 13vw matches HeroSection side padding — 250px at 1920px */}
            <SectionContainer style={{ paddingLeft: "13vw", paddingRight: "13vw" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8.33vw",
                        paddingTop: "6.25vw",
                        paddingBottom: "6.25vw",
                    }}
                >
                    {/* Row 1: heading + tags (left) / description (right) */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "7.29vw",
                        }}
                    >
                        {/* Left column */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1.04vw",
                                flexShrink: 0,
                                width: "30.21vw",
                            }}
                        >
                            <h2
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "2.5vw",
                                    lineHeight: 1.25,
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                }}
                            >
                                Learn. Connect. Grow.
                            </h2>

                            {/* Tag pill */}
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignSelf: "flex-start",
                                    alignItems: "center",
                                    padding: "0 0.52vw",
                                    background: "rgba(167, 186, 250, 0.55)",
                                    borderRadius: 4,
                                    height: "0.99vw",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: "0.83vw",
                                    }}
                                >
                                    {TAGS.map((tag) => (
                                        <span
                                            key={tag}
                                            style={{
                                                fontFamily: "var(--font-accent)",
                                                fontWeight: 500,
                                                fontSize: "0.78vw",
                                                lineHeight: "0.99vw",
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
                            style={{
                                fontFamily: "var(--font-base)",
                                fontWeight: 400,
                                fontSize: "1.04vw",
                                lineHeight: 1.25,
                                color: "var(--color-text-primary)",
                                margin: 0,
                                flex: 1,
                            }}
                        >
                            Where knowledge meets career. Choose your flow: self-paced study
                            or live sessions with mentors. Certificates, tests, and a smart
                            calendar — everything for your upgrade in one tab.
                        </p>
                    </div>

                    {/* Row 2: USP glass cards */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "stretch",
                            gap: "1.04vw",
                        }}
                    >
                        {USP_CARDS.map((card) => (
                            <UspCard
                                key={card.title}
                                title={card.title}
                                description={card.description}
                            />
                        ))}
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}
