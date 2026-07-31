import type { CourseLesson, CourseTest, LessonDocument, LessonItem } from "../model/module";
import type { CourseProgress } from "../model/progress";
import type { CourseReview } from "../model/review";
import type { CourseDetail } from "../model/types";

export const MOCK_COURSE_DETAIL_SLUG = "ux-ui-design-mastery";

export const mockCourseDetail: CourseDetail = {
  id: 1,
  image: "/mocks/courses/ux-ui-design-mastery.png",
  image_hash: "mock-image-hash",
  title: "UX/UI Design Mastery",
  subtitle: "From Logic to Visual Excellence",
  quote:
    "My course isn't just about moving pixels. It's about learning to think like an experience architect, understanding user psychology, and speaking the language of business",
  short_description: "A career-oriented design program for product-minded designers.",
  full_description: `
    <p>This comprehensive program is designed for aspiring designers who want to master
    the art of creating seamless digital experiences. Move beyond aesthetics and learn
    to build <strong>data-driven, user-centric interfaces</strong> for global markets.</p>
    <p>You will cover the full product design loop: research, information architecture,
    high-fidelity prototyping, design systems, and usability testing. Every module ends
    with a portfolio-worthy project reviewed by a senior designer.</p>
    <h3>What you will learn</h3>
    <ul>
      <li>Conduct qualitative research and translate insights into product decisions.</li>
      <li>Design scalable component libraries and design tokens.</li>
      <li>Prototype complex interactions in Figma with confidence.</li>
      <li>Run usability tests and ship measurable improvements.</li>
    </ul>
  `,
  slug: MOCK_COURSE_DETAIL_SLUG,
  category: {
    id: 1,
    name: "Design",
    slug: "design",
    description: "Visual and product design courses.",
  },
  level: "intermediate",
  language: "english",
  mode: "with_teacher",
  delivery_type: "scheduled",
  course_type: "profession",
  duration_hours: 64,
  total_duration_minutes: 64 * 60,
  lessons_count: 10,
  with_certificate: true,
  certificate_description:
    "The student mastered end-to-end UX/UI design: research, wireframes, prototyping, and usability testing.",
  is_on_sale: false,
  discount_percent: null,
  passing_score: 80,
  rating_avg: "4.9",
  rating_count: 1850,
  students_count: 1850,
  is_enrolled: true,
  enrollment_access_status: "active",
  group_chat_url: "https://t.me/ux-ui-design-mastery",
  status: "published",
  published_at: "2026-01-10T00:00:00Z",
  enrolled_at: null,
  pending_edit_status: null,
  tags: [
    { id: 1, name: "Figma" },
    { id: 2, name: "Design Systems" },
    { id: 3, name: "User Research" },
  ],
  teacher: {
    id: 10,
    name: "Sarah Jenkins",
    avatar: "/mocks/teachers/teacher-image.png",
    bio: "Sarah is a Senior Product Designer with over 10 years of experience at the heart of Europe’s tech hub — Berlin. She specializes in building complex digital ecosystems for high-growth FinTech startups and AI-driven platforms. Her design philosophy is a unique blend of rigorous German functionalism and classic Italian aesthetic sensibility.",
    years_experience: 10,
    students_taught: 500,
    partnerships_count: 300,
  },
  moderator_id: null,
  moderator_comment: "",
  moderation_review: null,
  delivery_formats: [
    {
      id: 1,
      format_type: "group",
      start_type: null,
      course_start_date: null,
      access_duration_days: null,
      start_date: "2026-01-15",
      enrollment_deadline: "2026-01-08",
      unlock_mode: "sequential",
      max_students: null,
      enrolled_count: 0,
      completed_count: 0,
      pricing: {
        id: 1,
        price: "599.00",
        final_price: "599.00",
        currency: "EUR",
        installment_count: 4,
        installment_amount: "160.00",
        final_installment_amount: "160.00",
      },
    },
    {
      id: 2,
      format_type: "individual",
      start_type: "manual",
      course_start_date: null,
      access_duration_days: null,
      start_date: null,
      enrollment_deadline: null,
      unlock_mode: null,
      max_students: 5,
      enrolled_count: 0,
      completed_count: 0,
      pricing: {
        id: 2,
        price: "899.00",
        final_price: "899.00",
        currency: "EUR",
        installment_count: 4,
        installment_amount: "240.00",
        final_installment_amount: "240.00",
      },
    },
  ],
  cohorts: [
    {
      id: 1,
      delivery_format: 1,
      name: "Group A",
      duration_months: 4,
      hours_per_week: 3,
      hours_per_week_min: 3,
      hours_per_week_max: 6,
      group_size: 12,
      start_date: "2026-01-15",
      enrollment_deadline: "2026-01-08",
      is_enrollment_open: true,
      members_count: 0,
      members: [],
    },
  ],
  modules: [
    {
      id: 1,
      title: "UX Strategy & Research",
      description: "Foundations of research-led product design.",
      order: 1,
      lessons: [
        {
          id: 1,
          title: "Introduction to the European Design Ecosystem",
          order: 1,
          duration_minutes: 45,
          is_preview: true,
        },
        {
          id: 2,
          title: "Qualitative Research: User Interviews & Empathy Mapping",
          order: 2,
          duration_minutes: 75,
          is_preview: false,
        },
        {
          id: 3,
          title: "Mapping the Journey: Advanced CJM & User Flows",
          order: 3,
          duration_minutes: 60,
          is_preview: false,
        },
      ],
      tests: [],
    },
    {
      id: 2,
      title: "High-Fidelity Prototyping",
      description: "From wireframes to interactive prototypes.",
      order: 2,
      lessons: [
        {
          id: 4,
          title: "Information Architecture & Content Strategy",
          order: 1,
          duration_minutes: 50,
          is_preview: false,
        },
        {
          id: 5,
          title: "Figma Mastery: Prototyping complex interactions",
          order: 2,
          duration_minutes: 90,
          is_preview: false,
        },
      ],
      tests: [],
    },
    {
      id: 3,
      title: "UI Design & Design Systems",
      description: "Scalable visual systems and tokens.",
      order: 3,
      lessons: [
        {
          id: 6,
          title: "Visual Language: Typography, Color, Spacing",
          order: 1,
          duration_minutes: 55,
          is_preview: false,
        },
        {
          id: 7,
          title: "Component Libraries and Design Tokens",
          order: 2,
          duration_minutes: 80,
          is_preview: false,
        },
        {
          id: 8,
          title: "Theming and Dark Mode",
          order: 3,
          duration_minutes: null,
          is_preview: false,
        },
      ],
      tests: [],
    },
    {
      id: 4,
      title: "Testing & Product Delivery",
      description: "Validating designs and shipping with engineers.",
      order: 4,
      lessons: [
        {
          id: 9,
          title: "Usability Testing Fundamentals",
          order: 1,
          duration_minutes: 65,
          is_preview: false,
        },
        {
          id: 10,
          title: "Design Handoff and Engineering Collaboration",
          order: 2,
          duration_minutes: 70,
          is_preview: false,
        },
      ],
      tests: [],
    },
  ],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-10T00:00:00Z",
};

export const mockCourseReviews: CourseReview[] = [
  {
    id: 1,
    student: { id: 101, name: "Emily Watson", avatar: null, role: "Junior Product Designer" },
    rating: 5,
    text: "Sarah is an incredible mentor. Her experience in the Berlin tech scene brings a practical edge to the course that you won't find in textbooks. The module on Design Systems alone is worth the price.",
    created_at: "2026-03-12T10:00:00Z",
  },
  {
    id: 2,
    student: { id: 102, name: "Marcus Nilsson", avatar: null, role: "Python Developer" },
    rating: 5,
    text: "The live workshops are the highlight. Having a Senior Designer critique your work in real-time is a game-changer. I transitioned from graphic design to a UI role within weeks of finishing.",
    created_at: "2026-02-28T10:00:00Z",
  },
  {
    id: 3,
    student: { id: 103, name: "Amara Okafor", avatar: null, role: "Performance Marketer" },
    rating: 5,
    text: "The community is the biggest asset. We had a group chat with the mentor where any question was answered within minutes. You never feel alone with the theory; you're part of a team.",
    created_at: "2026-02-10T10:00:00Z",
  },
  {
    id: 4,
    student: { id: 104, name: "Lucas Wojcik", avatar: null, role: "Project Manager" },
    rating: 5,
    text: "Loved the interactive quizzes after each module. Downloaded my PDF certificate, added it to LinkedIn, and got several interview invites within a week.",
    created_at: "2026-01-22T10:00:00Z",
  },
];

/**
 * Dev-mode progress snapshot for `MOCK_COURSE_DETAIL_SLUG`. The first 3 lessons
 * are "completed"; the last opened lesson is #4 (Information Architecture).
 */
export const mockCourseProgress: CourseProgress = {
  enrollment_id: 9999,
  lessons_completed_count: 3,
  lessons_count: 10,
  completed_lesson_ids: [1, 2, 3],
  last_lesson_id: 4,
  last_opened_at: "2026-05-29T12:30:00Z",
  test_average: 72,
  tests_passed: 2,
  tests_failed: 1,
  tests_skipped: 1,
  tests_total: 4,
  is_with_teacher: true,
  homework_average: 85,
  homework_graded: 2,
  homework_ungraded: 1,
  homework_total: 3,
  can_complete_course: false,
  is_course_completed: false,
};

const SAMPLE_BODY_HTML = `
  <p>This lesson walks through the foundations of the topic. Read through the material,
  watch the embedded video for a worked example, and download the worksheet at the bottom
  to practise on your own before the next live session.</p>
  <h3>What you will learn</h3>
  <ul>
    <li>Frame the problem from a user's perspective.</li>
    <li>Run a 30-minute interview that yields specific, actionable insights.</li>
    <li>Translate raw notes into an empathy map your team can rally around.</li>
  </ul>
  <p>Use the worksheet to record your observations as you work through the exercise.</p>
`;

const SAMPLE_BODY_HTML_2 = `
  <p>This is a second reading block. A lesson is an ordered list of content
  blocks, so it can stack several readings and videos; the player gathers all
  readings into this tab and all videos into the Video tab.</p>
  <ul>
    <li>Synthesize raw interview notes into recurring themes.</li>
    <li>Prioritize problems by impact and frequency.</li>
    <li>Turn the findings into a single, sharp problem statement.</li>
  </ul>
`;

const SAMPLE_VIDEO_INTRO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_VIDEO_DEMO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

const SAMPLE_DOCUMENTS: LessonDocument[] = [
  {
    id: 1,
    original_name: "Lesson worksheet.pdf",
    url: "https://example.com/worksheet.pdf",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: 2,
    original_name: "Slides.pdf",
    url: "https://example.com/slides.pdf",
    created_at: "2026-01-10T00:00:00Z",
  },
];

/** Sample quiz block; lesson items of type "test" carry one of these. */
const SAMPLE_TEST: CourseTest = {
  id: 900,
  title: "Module checkpoint",
  description: "A short quiz to confirm the key ideas before moving on.",
  passing_score: 75,
  order: 1,
  allow_retakes: true,
  max_attempts: null,
  questions: [
    {
      id: 9001,
      question_type: "single_choice",
      text: "What is the goal of an empathy map?",
      options: [
        "Pick brand colors",
        "Capture what a user says, thinks, does, and feels",
        "Write production code",
        "Estimate engineering effort",
      ],
      correct_indices: [1],
      correct_bool: null,
      sample_answer: "",
      order: 1,
    },
    {
      id: 9002,
      question_type: "multiple_choice",
      text: "Which of the following are qualitative research methods? (select all that apply)",
      options: [
        "User interviews",
        "A/B testing",
        "Contextual inquiry",
        "Server log analysis",
      ],
      correct_indices: [0, 2],
      exact_set_match: true,
      correct_bool: null,
      sample_answer: "",
      order: 2,
    },
    {
      id: 9003,
      question_type: "true_false",
      text: "User interviews should lead with yes/no questions.",
      options: [],
      correct_bool: false,
      sample_answer: "",
      order: 3,
    },
    {
      id: 9004,
      question_type: "short_answer",
      text: "What Figma feature lets you reuse styles and components across files?",
      options: [],
      correct_bool: null,
      sample_answer: "Libraries",
      accepted_answers: ["Library", "Team library"],
      order: 4,
    },
  ],
};

/**
 * Dev-mode content blocks for a lesson. A lesson is an ordered list of typed
 * items (text / video / test); the player groups every video item under the
 * Video tab and every text item under Reading. Test items render as an
 * interactive quiz. A few lessons get distinct shapes so the block model is easy
 * to see:
 *   2  -> video, reading, video, reading (a rich multi-block lesson)
 *   3  -> video, reading, and a test block
 *   4  -> reading only
 *   8  -> video only
 *   otherwise -> one video + one reading
 */
function buildLessonItems(lessonId: number): LessonItem[] {
  const video = (order: number, url: string, name: string): LessonItem => ({
    id: lessonId * 100 + order,
    item_type: "video",
    order,
    video_url: url,
    original_video_name: name,
  });
  const reading = (order: number, html: string): LessonItem => ({
    id: lessonId * 100 + order,
    item_type: "text",
    order,
    body_html: html,
  });

  switch (lessonId) {
    case 2:
      return [
        video(1, SAMPLE_VIDEO_INTRO, "Interview walkthrough.mp4"),
        reading(2, SAMPLE_BODY_HTML),
        video(3, SAMPLE_VIDEO_DEMO, "Empathy map demo.mp4"),
        reading(4, SAMPLE_BODY_HTML_2),
      ];
    case 3:
      return [
        video(1, SAMPLE_VIDEO_INTRO, "Journey mapping.mp4"),
        reading(2, SAMPLE_BODY_HTML),
        { id: 303, item_type: "test", order: 3, test: SAMPLE_TEST },
      ];
    case 4:
      return [reading(1, SAMPLE_BODY_HTML_2)];
    case 8:
      return [video(1, SAMPLE_VIDEO_INTRO, "Dark mode tokens.mp4")];
    default:
      return [video(1, SAMPLE_VIDEO_INTRO, "Lesson video.mp4"), reading(2, SAMPLE_BODY_HTML)];
  }
}

/** Lessons that ship downloadable materials (others render no Materials list). */
const LESSONS_WITH_DOCUMENTS = new Set([1, 2, 3]);

/** Dev-mode lesson detail map keyed by lesson id (matches `mockCourseDetail.modules[].lessons[].id`). */
export const mockLessonDetails: Record<number, CourseLesson> = {};
for (const mod of mockCourseDetail.modules) {
  for (const lesson of mod.lessons) {
    mockLessonDetails[lesson.id] = {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      duration_minutes: lesson.duration_minutes,
      is_preview: lesson.is_preview,
      documents: LESSONS_WITH_DOCUMENTS.has(lesson.id) ? SAMPLE_DOCUMENTS : [],
      meeting_url: lesson.is_preview ? null : "https://meet.google.com/abc-defg-hij",
      items: buildLessonItems(lesson.id),
    };
  }
}
