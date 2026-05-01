import { SectionContainer } from "@/shared/ui/SectionContainer";

export function StoriesSection() {
    return (
        <section>
            <SectionContainer>
                <div style={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-accent)", fontSize: 18, color: "var(--color-text-muted)" }}>
                        Stories of growth and new beginnings
                    </span>
                </div>
            </SectionContainer>
        </section>
    );
}
