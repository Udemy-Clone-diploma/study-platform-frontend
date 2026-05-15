import type { CourseDetail } from "../model/types";

export const MOCK_COURSE_DETAIL_SLUG = "ux-ui-design-mastery";

export const mockCourseDetail: CourseDetail = {
  id: 1,
  image: null,
  title: "UX/UI Design Mastery",
  short_description:
    "A career-oriented design program for product-minded designers.",
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
  pricing_type: "full_payment",
  price: "599.00",
  duration_hours: 64,
  lessons_count: 10,
  with_certificate: true,
  is_on_sale: false,
  rating_avg: "4.9",
  students_count: 1850,
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
    avatar: null,
    bio: "Senior Product Designer with 10+ years of experience at FinTech and AI startups in Berlin. Blends rigorous German functionalism with Italian aesthetic sensibility.",
  },
  moderator_id: null,
  installment_count: 4,
  installment_amount: "160.00",
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
        },
        {
          id: 2,
          title: "Qualitative Research: User Interviews & Empathy Mapping",
          order: 2,
          duration_minutes: 75,
        },
        {
          id: 3,
          title: "Mapping the Journey: Advanced CJM & User Flows",
          order: 3,
          duration_minutes: 60,
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
        },
        {
          id: 5,
          title: "Figma Mastery: Prototyping complex interactions",
          order: 2,
          duration_minutes: 90,
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
        },
        {
          id: 7,
          title: "Component Libraries and Design Tokens",
          order: 2,
          duration_minutes: 80,
        },
        {
          id: 8,
          title: "Theming and Dark Mode",
          order: 3,
          duration_minutes: null,
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
        },
        {
          id: 10,
          title: "Design Handoff and Engineering Collaboration",
          order: 2,
          duration_minutes: 70,
        },
      ],
    },
  ],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-10T00:00:00Z",
};
