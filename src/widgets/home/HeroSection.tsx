import { SectionContainer } from "@/shared/ui/SectionContainer";

export function HeroSection() {
    return (
        <section>
            <SectionContainer>
                <div style={{ minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-accent)", fontSize: 18, color: "var(--color-text-muted)" }}>
                        Hero — Next-gen education
                    </span>
                </div>
            </SectionContainer>
        </section>
    );
}
