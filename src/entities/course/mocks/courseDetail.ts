import type { CourseReview } from "../model/review";
import type { CourseDetail } from "../model/types";

export const MOCK_COURSE_DETAIL_SLUG = "ux-ui-design-mastery";

export const mockCourseDetail: CourseDetail = {
  id: 1,
  image: "/mocks/courses/ux-ui-design-mastery.png",
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
  lessons_count: 10,
  with_certificate: true,
  is_on_sale: false,
  rating_avg: "4.9",
  rating_count: 1850,
  students_count: 1850,
  is_enrolled: false,
  status: "published",
  published_at: "2026-01-10T00:00:00Z",
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
  pricing_plans: [
    {
      id: 1,
      kind: "group",
      price: "599.00",
      currency: "EUR",
      installment_count: 4,
      installment_amount: "160.00",
    },
    {
      id: 2,
      kind: "individual",
      price: "899.00",
      currency: "EUR",
      installment_count: 4,
      installment_amount: "240.00",
    },
  ],
  cohorts: [
    {
      duration_months: 4,
      hours_per_week_min: 2,
      hours_per_week_max: 4,
      group_size: 12,
      delivery_mode: "both",
      start_date: "2026-01-15",
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
