"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createDirectChat } from "@/entities/chat";
import {
  getTeacherStudentDashboard,
  type TeacherStudentDashboard as DashboardData,
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { PageShell } from "@/shared/ui/PageShell";
import { UserIdentityCard, type UserIdentitySocial } from "@/shared/ui/UserIdentityCard";
import { Card } from "./DashboardOverview";
import { Dropdown, GrowthCard, type Option } from "./GrowthCard";
import {
  HomeworkReviewPanel,
  type HomeworkCourseOption,
  type HomeworkReviewListItem,
} from "./StudentHomeworkDashboardPanels";

const SOCIAL_ICONS = {
  instagram: { src: "/social-media-icons/instagrm-gray.svg", label: "Instagram" },
  linkedin: { src: "/social-media-icons/LinKedln-gray.svg", label: "LinkedIn" },
  facebook: { src: "/social-media-icons/Facebook-gray.svg", label: "Facebook" },
  behance: { src: "/social-media-icons/behance-gray.svg", label: "Behance" },
} as const;

const ACTIVITY_ACCENTS = {
  Task: "from-[#fff3dc] to-[#ffe7ef]",
  Test: "from-[#d6e0ff] to-[#a7bafa]",
} as const;

const ACTIVITY_ICONS = {
  Task: "/icons/world.png",
  Test: "/icons/statistics.svg",
} as const;

type CourseOption = DashboardData["courses"][number];

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
  })
    .format(new Date(value))
    .replace(/\//g, ".");
}

function MetricCard({
  label,
  value,
  options,
  course,
  onCourseChange,
}: {
  label: string;
  value: number;
  options: Option[];
  course: string;
  onCourseChange: (value: string) => void;
}) {
  return (
    <Card className="flex h-31 min-w-0 flex-col justify-between p-5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="text-base font-normal text-(--color-text-primary)">{label}</h2>
        <Dropdown value={course} options={options} onChange={onCourseChange} />
      </div>
      <p className="rounded-lg bg-(image:--gradient-student-stat) px-3 py-1 text-2xl text-(--color-blue)">
        {value}
      </p>
    </Card>
  );
}

function CourseCompletion({ courses }: { courses: CourseOption[] }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-(--color-text-primary)">
        Course completion level
      </h2>
      {courses.length ? (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card
              key={course.slug}
              className="flex h-35 items-center bg-(image:--gradient-schedule-card) p-4"
            >
              <div className="flex w-full min-w-0 gap-4">
                {course.image ? (
                  <Image
                    src={course.image}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-(image:--gradient-brand)" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold uppercase text-(--color-text-primary)">
                    {course.title}
                  </p>
                  <p className="truncate text-[10px] uppercase text-(--color-text-secondary)">
                    {course.teacher}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-(--color-border-light)">
                    <div
                      className="h-full rounded-full bg-(image:--gradient-brand)"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] font-bold text-(--color-text-primary)">
                    {course.progress}%
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex h-28 items-center justify-center p-5 text-sm text-(--color-text-secondary)">
          No course enrollments.
        </Card>
      )}
    </div>
  );
}

function StudentDashboardDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/backgrounds/learn-page-bg.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      <div className="absolute -bottom-72 -left-48 hidden h-[796px] w-[796px] opacity-30 lg:block">
        <Image
          src="/backgrounds/learn-planet.png"
          alt=""
          fill
          sizes="796px"
          className="object-contain"
        />
      </div>

      <div className="absolute -bottom-20 -left-80 hidden h-[725px] w-[1308px] -rotate-[23.27deg] opacity-30 lg:block">
        <Image
          src="/backgrounds/learn-bg-glow.svg"
          alt=""
          fill
          sizes="1308px"
          className="object-cover"
        />
      </div>

      <div className="absolute -bottom-6 left-[46%] hidden h-[271px] w-[271px] -rotate-90 opacity-30 lg:block">
        <Image src="/icons/gradient-circle.svg" alt="" fill sizes="271px" />
      </div>
      <div className="absolute bottom-24 left-[66%] hidden h-[119px] w-[119px] rotate-[163.47deg] opacity-30 lg:block">
        <Image src="/icons/gradient-circle.svg" alt="" fill sizes="119px" />
      </div>
      <div className="absolute bottom-28 right-[18%] hidden h-[59px] w-[59px] rotate-[47.29deg] opacity-30 lg:block">
        <Image src="/icons/gradient-circle.svg" alt="" fill sizes="59px" />
      </div>
      <div className="absolute bottom-2 right-4 hidden h-[192px] w-[342px] rotate-[22.72deg] opacity-30 lg:block">
        <Image src="/icons/gradient-ring.svg" alt="" fill sizes="342px" />
      </div>
    </div>
  );
}

/** Student analytics profile available to a teacher who teaches at least one of their courses. */
export function TeacherStudentDashboard({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messaging, setMessaging] = useState(false);
  const [course, setCourse] = useState("");

  useEffect(() => {
    let active = true;
    getTeacherStudentDashboard(studentId, course || undefined)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
        if (!course && result.courses[0]) setCourse(result.courses[0].slug);
      })
      .catch((requestError: Partial<ApiError>) => {
        if (!active) return;
        if (requestError.status === 404) {
          router.replace(`/profile/${studentId}`);
          return;
        }
        setError("The student analytics could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [course, router, studentId]);

  const courseOptions = useMemo<Option[]>(
    () => data?.courses.map((item) => ({ value: item.slug, label: item.title })) ?? [],
    [data?.courses],
  );
  const homeworkCourses = courseOptions as HomeworkCourseOption[];
  const homeworkItems = useMemo<HomeworkReviewListItem[]>(
    () =>
      data?.activities.map((activity) => ({
        id: activity.id,
        courseTitle: activity.course,
        courseValue: activity.course_slug,
        kind: activity.kind,
        title: activity.title,
        dateValue: activity.date,
        dateLabel: formatShortDate(activity.date),
        score: activity.score,
        iconSrc: ACTIVITY_ICONS[activity.kind],
        accent: ACTIVITY_ACCENTS[activity.kind],
        href: {
          pathname: "/teacher-dashboard/homework",
          query: {
            course: activity.course_slug,
            assignment: String(activity.assignment_id),
            submission: String(activity.id),
            queue: activity.status === "reviewed" ? "completed" : "to_review",
          },
        },
      })) ?? [],
    [data],
  );

  async function sendMessage() {
    if (!data) return;
    setMessaging(true);
    setError("");
    try {
      const chat = await createDirectChat(data.profile.id);
      router.push(`/teacher-dashboard/chats?chat=${chat.id}`);
    } catch {
      setError("The conversation could not be opened.");
      setMessaging(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-28 items-center justify-center text-(--color-blue)">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading student profile" />
        </div>
      </PageShell>
    );
  }

  if (error && !data) {
    return (
      <PageShell>
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl bg-(--color-error-surface) p-5 text-(--color-danger)"
        >
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      </PageShell>
    );
  }

  if (!data) return null;

  const socials = Object.entries(data.profile.socials).reduce<UserIdentitySocial[]>(
    (result, [key, href]) => {
      const social = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS];
      if (href && social) result.push({ key, href, label: social.label, iconSrc: social.src });
      return result;
    },
    [],
  );

  return (
    <PageShell className="relative isolate overflow-hidden bg-(--color-bg)">
      <StudentDashboardDecor />

      <div className="relative z-10 mx-auto max-w-[1760px]">
        {error ? (
          <p role="alert" className="mb-4 text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        <div className="grid items-start gap-5 2xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[420px] space-y-4 2xl:mx-0">
            <UserIdentityCard
              name={data.profile.name}
              avatar={data.profile.avatar}
              socials={socials}
              onMessage={() => void sendMessage()}
              messaging={messaging}
            />
            <CourseCompletion courses={data.courses} />
          </div>

          <div className="min-w-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Homeworks done"
                value={data.metrics.homeworks_done}
                options={courseOptions}
                course={course}
                onCourseChange={setCourse}
              />
              <MetricCard
                label="Tests done"
                value={data.metrics.tests_done}
                options={courseOptions}
                course={course}
                onCourseChange={setCourse}
              />
              <MetricCard
                label="Absences"
                value={data.metrics.absences}
                options={courseOptions}
                course={course}
                onCourseChange={setCourse}
              />
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[470px_minmax(0,1fr)]">
              <HomeworkReviewPanel
                items={homeworkItems}
                courses={homeworkCourses}
                courseValue={course}
                onCourseChange={setCourse}
                className="h-[500px]"
                titleHref={null}
              />
              <GrowthCard
                studentId={studentId}
                initialPeriod="yearly"
                defaultToFirstCourse
                cardClassName="h-[344px] p-5"
                chartHeightClassName="h-[220px]"
              />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
