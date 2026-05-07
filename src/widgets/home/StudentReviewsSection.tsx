import { SectionContainer } from "@/shared/ui/SectionContainer";
import { StudentReviewCard, type StudentReview } from "@/features/users/ui/StudentReviewCard";

const ROW1: StudentReview[] = [
    {
        id: 1,
        text: "I never thought I could master UX/UI from scratch. Thanks to Sarah Jenkins, I landed my first job offer before even finishing the course! The platform is incredibly intuitive; everything is in one tab.",
        authorName: "Emily Watson",
        authorRole: "Junior Product Designer",
        authorAvatar: null,
    },
    {
        id: 2,
        text: "I chose the self-paced format due to my busy schedule. The fact that progress is auto-saved and videos work on any device is a lifesaver. David Chen explains code like he's just talking to a friend.",
        authorName: "Marcus Nilsson",
        authorRole: "Python Developer",
        authorAvatar: null,
    },
];

const ROW2: StudentReview[] = [
    {
        id: 3,
        text: "The community is the biggest asset. We had a group chat with the mentor where any question was answered within minutes. You never feel alone with the theory; you're part of a team.",
        authorName: "Amara Okafor",
        authorRole: "Performance Marketer",
        authorAvatar: null,
    },
    {
        id: 4,
        text: "Took a management course and loved the interactive quizzes after each module. Downloaded my PDF certificate, added it to LinkedIn, and got several interview invites within a week.",
        authorName: "Lucas Wójcik",
        authorRole: "Project Manager",
        authorAvatar: null,
    },
];

export function StudentReviewsSection() {
    return (
        <section style={{ background: "var(--gradient-feedback)" }}>
            <SectionContainer>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3.125vw",
                        paddingTop: "7.19vw",
                        paddingBottom: "7.24vw",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.46vw",
                            maxWidth: "36.46vw",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignSelf: "flex-start",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 0.52vw",
                                background: "var(--color-badge-lavender)",
                                borderRadius: 4,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-accent)",
                                    fontWeight: 500,
                                    fontSize: "1.04vw",
                                    lineHeight: "1.3vw",
                                    color: "var(--color-blue)",
                                }}
                            >
                                FEEDBACK
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                            <h2
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "2.5vw",
                                    lineHeight: "3.125vw",
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                }}
                            >
                                Loved by 10k+ students worldwide
                            </h2>
                            <p
                                style={{
                                    fontFamily: "var(--font-base)",
                                    fontWeight: 400,
                                    fontSize: "1.25vw",
                                    lineHeight: "1.5625vw",
                                    color: "var(--color-text-secondary)",
                                    margin: 0,
                                }}
                            >
                                Real people. Real feedback. No filters. Discover why learners
                                from 50+ countries choose our platform every day.
                            </p>
                        </div>
                    </div>

                    {/* Cards grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.04vw" }}>
                        {/* Row 1: narrow (580) + wide (820) */}
                        <div style={{ display: "flex", gap: "1.04vw" }}>
                            <StudentReviewCard review={ROW1[0]} style={{ flex: 580 }} />
                            <StudentReviewCard review={ROW1[1]} style={{ flex: 820 }} />
                        </div>
                        {/* Row 2: equal halves */}
                        <div style={{ display: "flex", gap: "1.04vw" }}>
                            <StudentReviewCard review={ROW2[0]} style={{ flex: 1 }} />
                            <StudentReviewCard review={ROW2[1]} style={{ flex: 1 }} />
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}
