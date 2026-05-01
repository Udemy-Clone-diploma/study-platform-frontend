import { SectionContainer } from "@/shared/ui/SectionContainer";

export function FeedbackSection() {
    return (
        <section>
            <SectionContainer>
                <div style={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-accent)", fontSize: 18, color: "var(--color-text-muted)" }}>
                        Learn from the best
                    </span>
                </div>
            </SectionContainer>
        </section>
    );
}
