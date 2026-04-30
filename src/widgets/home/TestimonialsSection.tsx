import { SectionContainer } from "@/shared/ui/SectionContainer";

export function TestimonialsSection() {
    return (
        <section>
            <SectionContainer>
                <div style={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-accent)", fontSize: 18, color: "var(--color-text-muted)" }}>
                        Loved by 10k+ students worldwide
                    </span>
                </div>
            </SectionContainer>
        </section>
    );
}
