export type StudentDashboardActivity = {
  id: number;
  assignment_id: number;
  course_slug: string;
  course: string;
  kind: "Task" | "Test";
  title: string;
  date: string;
  score: number | null;
  status: string;
};

export type TeacherStudentDashboard = {
  profile: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    socials: Record<"instagram" | "linkedin" | "facebook" | "behance", string>;
  };
  metrics: { homeworks_done: number; tests_done: number; absences: number };
  activities: StudentDashboardActivity[];
  growth: { average: number; points: { label: string; value: number }[] };
  courses: { slug: string; title: string; teacher: string; image: string | null; progress: number }[];
};
