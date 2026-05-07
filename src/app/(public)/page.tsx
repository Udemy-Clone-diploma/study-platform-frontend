import Image from "next/image";
import { getNewCourses, getPopularCourses } from "@/entities/course";
import { getTopTeachers } from "@/entities/user";
import { HeroSection } from "@/widgets/home/HeroSection";
import { NewCoursesSection } from "@/widgets/home/NewCoursesSection";
import { PopularCoursesSection } from "@/widgets/home/PopularCoursesSection";
import { PlatformBenefitsSection } from "@/widgets/home/PlatformBenefitsSection";
import { CategoriesSection } from "@/widgets/home/CategoriesSection";
import { StudentReviewsSection } from "@/widgets/home/StudentReviewsSection";
import { StudentStoriesSection } from "@/widgets/home/StudentStoriesSection";
import { TopMentorsSection } from "@/widgets/home/TopMentorsSection";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [newCourses, popularCourses, topTeachers] = await Promise.all([
        getNewCourses().catch(() => []),
        getPopularCourses().catch(() => []),
        getTopTeachers().catch(() => []),
    ]);

    return (
        <main style={{ position: "relative", overflow: "hidden", }}>

            {/* Decorative layer — all vw so blobs + glitter scale as one unit */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none"  }}>

                {/* Blob right top */}
                <div style={{
                    position: "absolute",
                    width: "35vw",
                    height: "35vw",
                    right: "-2vw",
                    top: "5vw",
                    background: "var(--gradient-blob)",
                    filter: "blur(90px)",
                    borderRadius: "50%",
                }} />

                {/* Blob right center */}
                <div style={{
                    position: "absolute",
                    width: "32vw",
                    height: "32vw",
                    right: "20vw",
                    top: "10vw",
                    background: "var(--gradient-blob)",
                    filter: "blur(90px)",
                    borderRadius: "50%",
                }} />

                {/* Glitter texture */}
                <div style={{
                    position: "absolute",
                    right: "-24vw",
                    top: "-3vw",
                    width: "124vw",
                    height: "63vw",
                    backgroundImage: "url('/main/glitter-bg.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    mixBlendMode: "lighten",
                }} />

                {/* Blob courses — lavender ellipse behind New/Popular sections */}
                <div style={{
                    position: "absolute",
                    width: "40vw",
                    height: "50vw",
                    left: "50%",
                    top: "46vw",
                    background: "var(--color-brand-lavender)",
                    opacity: 0.5,
                    filter: "blur(150px)",
                    transform: "translateX(-50%) rotate(-15deg)",
                    pointerEvents: "none",
                }} />

            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
                {/* Hero illustration — lives here so it's unconstrained by SectionContainer */}
                <div style={{
                    position: "absolute",
                    right: "6vw",
                    top: "6vw",
                    pointerEvents: "none",
                }}>
                    <Image
                        src="/main/Image main.png"
                        alt=""
                        width={789}
                        height={660}
                        priority
                        style={{ width: "41.1vw", maxWidth: 789, height: "auto", display: "block" }}
                    />
                </div>
                <HeroSection />
                <NewCoursesSection courses={newCourses} />
                <PopularCoursesSection courses={popularCourses} />
                <PlatformBenefitsSection />
                <CategoriesSection />
                <TopMentorsSection teachers={topTeachers} />
                <StudentReviewsSection />
                <StudentStoriesSection />
            </div>
        </main>
    );
}
