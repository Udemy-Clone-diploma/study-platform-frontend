import type { Category } from "@/features/courses/model/types/category";
import { SectionContainer } from "@/shared/ui/SectionContainer";

type Props = { categories: Category[] };

export function CategoriesSection({ categories }: Props) {
    return (
        <section>
            <SectionContainer>
                <div style={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-accent)", fontSize: 18, color: "var(--color-text-muted)" }}>
                        Choose your field of growth — {categories.length} categories
                    </span>
                </div>
            </SectionContainer>
        </section>
    );
}
