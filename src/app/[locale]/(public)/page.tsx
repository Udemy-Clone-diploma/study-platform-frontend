import {
  CategoriesSection,
  HeroSection,
  NewCoursesSection,
  PlatformBenefitsSection,
  PopularCoursesSection,
  StudentReviewsSection,
  StudentStoriesSection,
  TopMentorsSection,
} from "@/widgets/home";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import {
  getNewCourses,
  getPopularCourses,
  getTopReviews,
  getWishlistSlugs,
} from "@/entities/course";
import { getTopTeachers } from "@/entities/user";
import { getArticles, getBlogCategories } from "@/entities/blog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const [
    newCourses,
    popularCourses,
    topTeachers,
    topReviews,
    wishlistedSlugs,
    studentStories,
    blogCategories,
  ] = await Promise.all([
    getNewCourses(locale).catch(() => []),
    getPopularCourses(locale).catch(() => []),
    getTopTeachers().catch(() => []),
    getTopReviews().catch(() => []),
    getWishlistSlugs().catch(() => []),
    getArticles({ category: "student-stories", lang: locale }).catch(() => []),
    getBlogCategories(locale).catch(() => []),
  ]);
  const studentStoriesCategory = blogCategories.find((c) => c.slug === "student-stories") ?? null;

  return (
    <main style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative layer — all vw so blobs + glitter scale as one unit */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            width: "35vw",
            height: "35vw",
            right: "-2vw",
            top: "5vw",
            background: "var(--gradient-blob)",
            filter: "blur(90px)",
            borderRadius: "50%",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "32vw",
            height: "32vw",
            right: "20vw",
            top: "10vw",
            background: "var(--gradient-blob)",
            filter: "blur(90px)",
            borderRadius: "50%",
          }}
        />

        <div
          style={{
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
          }}
        />

        {/* Blob courses — lavender ellipse behind New/Popular sections */}
        <div
          style={{
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
          }}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Hero illustration — lives here so it's unconstrained by SectionContainer.
                    Stacked above the text and stretched to the page's content width below
                    1024px (same gutter as SectionContainer); absolutely positioned top-right
                    of the text column at lg+ (matches the original desktop layout). */}
        <div
          className="mx-auto flex w-[min(1420px,calc(100%-32px))] justify-center pt-[6vw] lg:absolute lg:block lg:w-auto lg:justify-start lg:pt-0 lg:right-[6vw] lg:top-[6vw]"
          style={{ pointerEvents: "none" }}
        >
          <Image
            src="/main/Image main.png"
            alt=""
            width={789}
            height={660}
            priority
            className="w-full lg:w-[41.1vw]"
            style={{ maxWidth: 789, height: "auto", display: "block" }}
          />
        </div>
        <HeroSection />
        <NewCoursesSection courses={newCourses} wishlistedSlugs={wishlistedSlugs} />
        <PopularCoursesSection courses={popularCourses} wishlistedSlugs={wishlistedSlugs} />
        <PlatformBenefitsSection />
        <CategoriesSection />
        <TopMentorsSection teachers={topTeachers} />
        <StudentReviewsSection reviews={topReviews} />
        <StudentStoriesSection
          articles={studentStories.slice(0, 8)}
          category={studentStoriesCategory}
        />
      </div>
    </main>
  );
}
