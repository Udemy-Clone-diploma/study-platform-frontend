import { getNewCourses, getPopularCourses, getCategories } from "@/features/courses/api/coursesApi";
import { HeroSection } from "@/widgets/home/HeroSection";
import { NewCoursesSection } from "@/widgets/home/NewCoursesSection";
import { PopularCoursesSection } from "@/widgets/home/PopularCoursesSection";
import { ValuePropositionSection } from "@/widgets/home/ValuePropositionSection";
import { CategoriesSection } from "@/widgets/home/CategoriesSection";
import { TestimonialsSection } from "@/widgets/home/TestimonialsSection";
import { StoriesSection } from "@/widgets/home/StoriesSection";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [newCourses, popularCourses, categories] = await Promise.all([
        getNewCourses().catch(() => []),
        getPopularCourses().catch(() => []),
        getCategories().catch(() => []),
    ]);

    return (
        <main>
            <HeroSection />
            <NewCoursesSection courses={newCourses} />
            <PopularCoursesSection courses={popularCourses} />
            <ValuePropositionSection />
            <CategoriesSection categories={categories} />
            <TestimonialsSection />
            <StoriesSection />
        </main>
    );
}
