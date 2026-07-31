"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { CourseDetail, CourseProgress } from "@/entities/course";
import { byOrder, useCompletionRedirect, useCourseProgress } from "@/entities/course";
import { sanitizeCourseHtml } from "@/shared/lib/sanitizeCourseHtml";
import { StartCourseButton } from "@/features/learning";
import { GradientButton } from "@/shared/ui/GradientButton";
import { LearnCurriculumModule } from "./LearnCurriculumModule";
import { LearnPageDecor } from "./LearnPageDecor";
import { LearnTabs } from "./LearnTabs";

type Props = {
  course: CourseDetail;
  /** Pre-fetched progress (dev-mock route); when set the client fetch is skipped. */
  initialProgress?: CourseProgress | null;
  /** Dev-mock course: progress comes from localStorage instead of the API. */
  isMock?: boolean;
};

/** Course tab of the lesson player at `/learn/<slug>`: title, description, Start CTA, mentor tip, module accordion. */
export function CourseOverviewView({ course, initialProgress = null, isMock = false }: Props) {
  const t = useTranslations("CourseOverview");
  const sortedModules = useMemo(() => byOrder(course.modules), [course.modules]);

  const [openModuleIds, setOpenModuleIds] = useState<Set<number>>(
    () => new Set(sortedModules[0] ? [sortedModules[0].id] : []),
  );
  // Progress is incidental here, so its load error is ignored.
  const { progress } = useCourseProgress(course.slug, initialProgress, isMock);

  useCompletionRedirect(progress?.is_course_completed);

  const allOpen = openModuleIds.size === sortedModules.length && sortedModules.length > 0;

  const handleToggleAll = () => {
    if (allOpen) {
      setOpenModuleIds(new Set());
    } else {
      setOpenModuleIds(new Set(sortedModules.map((m) => m.id)));
    }
  };

  const handleToggleOne = (moduleId: number) => {
    setOpenModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const formatLabel =
    course.mode === "with_teacher" ? t("formatWithTeacher") : t("formatSelfPaced");
  const cohort = course.cohorts[0] ?? null;
  const scheduleHint = cohort
    ? ` ${t("scheduleHint", { min: cohort.hours_per_week_min ?? 0, max: cohort.hours_per_week_max ?? 0 })}`
    : "";

  const firstLessonId = sortedModules.flatMap((m) => byOrder(m.lessons))[0]?.id ?? null;
  const targetLessonId = progress?.last_lesson_id ?? firstLessonId;
  const hasProgress = (progress?.lessons_completed_count ?? 0) > 0;

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <LearnPageDecor />

      <div className="relative z-10 flex w-full flex-col gap-8 px-5 py-6 lg:gap-12 lg:px-12 lg:py-12 xl:gap-15 xl:px-[90px] xl:py-15">
        <LearnTabs slug={course.slug} active="course" />

        <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
          <div className="flex max-w-[938px] flex-col gap-2">
            <h1 className="font-(family-name:--font-base) text-3xl leading-none text-(--color-text-primary) lg:text-5xl">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="font-(family-name:--font-base) text-xl leading-tight text-(--color-text-secondary) lg:text-3xl">
                {course.subtitle}
              </p>
            )}
          </div>
          {course.group_chat_url && <GroupChatLink href={course.group_chat_url} />}
        </header>

        <div className="flex max-w-[1657px] flex-col gap-6">
          <CourseDescriptionText html={course.full_description} />
          <p className="max-w-[580px] font-(family-name:--font-base) text-base leading-tight text-(--color-text-primary) lg:text-xl">
            <span className="font-bold">{t("formatLabel")}</span> {formatLabel}
            {scheduleHint}
          </p>
        </div>

        <div className="flex flex-col items-start gap-8 lg:gap-12">
          <StartCourseButton
            slug={course.slug}
            lessonId={targetLessonId}
            hasProgress={hasProgress}
          />
          {/* xl: 230px from the screen edge = 140px margin + the container's 90px px */}
          <div className="mr-5 self-end lg:mr-24 xl:mr-[140px]">
            <TeacherTip
              teacherName={course.teacher.name}
              quote={course.quote}
              avatar={course.teacher.avatar}
            />
          </div>
        </div>

        <div className="mr-auto flex w-full max-w-[940px] flex-col gap-8 pt-6 lg:ml-8 lg:gap-12 lg:pt-14 xl:ml-14 xl:max-w-[70%] xl:gap-15 xl:pt-10">
          <div className="flex justify-end">
            <GradientButton
              onClick={handleToggleAll}
              aria-pressed={allOpen}
              style={{ width: 200, justifyContent: "center" }}
            >
              {allOpen ? t("collapseAll") : t("openAll")}
            </GradientButton>
          </div>

          <div className="flex w-full flex-col">
            {sortedModules.map((mod) => (
              <LearnCurriculumModule
                key={mod.id}
                courseModule={mod}
                slug={course.slug}
                isOpen={openModuleIds.has(mod.id)}
                onToggle={() => handleToggleOne(mod.id)}
                completedLessonIds={progress?.completed_lesson_ids}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Group chat" outlined link in the top-right of the hero. Opens the chat URL in a new tab. */
function GroupChatLink({ href }: { href: string }) {
  const t = useTranslations("CourseOverview");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-2 self-start whitespace-nowrap font-(family-name:--font-accent) text-sm uppercase text-(--color-text-primary) transition hover:opacity-80 lg:mt-2 lg:text-xl"
    >
      {t("groupChat")}
      <ArrowUpRight aria-hidden="true" className="h-5 w-5 sm:h-7 sm:w-7" />
    </a>
  );
}

/** Rich-text course description, sanitized before injection. */
function CourseDescriptionText({ html }: { html: string }) {
  return (
    <div
      className="font-(family-name:--font-base) text-base leading-snug text-(--color-text-primary) lg:text-2xl [&>p]:mb-3 [&>p:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: sanitizeCourseHtml(html) }}
    />
  );
}

type TeacherTipProps = {
  teacherName: string;
  quote: string | null;
  avatar: string | null;
};

/** "Useful tips from <teacher>" card with a circular gradient avatar on the right. */
function TeacherTip({ teacherName, quote, avatar }: TeacherTipProps) {
  const t = useTranslations("CourseOverview");
  if (!quote) return null;
  return (
    <div className="flex items-center gap-5">
      <div className="flex max-w-[580px] flex-col items-end gap-2 text-right text-(--color-text-primary)">
        <p className="font-(family-name:--font-base) text-base font-bold leading-tight lg:text-xl">
          {t("usefulTipsFrom", { name: teacherName })}
        </p>
        <p className="font-(family-name:--font-base) text-sm leading-snug lg:text-base">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
      <div
        className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-full lg:h-24 lg:w-24 xl:h-25 xl:w-25"
        style={{ background: "var(--gradient-brand)" }}
      >
        {avatar && <Image src={avatar} alt="" fill className="object-cover" sizes="100px" />}
      </div>
    </div>
  );
}
