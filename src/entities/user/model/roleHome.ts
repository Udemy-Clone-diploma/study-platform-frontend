import type { UserRole } from "./types";

/** Default landing path for each role. Used by the proxy, the login redirect, and the user dropdown. */
export const ROLE_HOME: Record<UserRole, string> = {
  administrator: "/admin",
  moderator: "/moderator-dashboard",
  teacher: "/teacher-dashboard",
  student: "/student-dashboard",
};

/** Resolve a role's landing path, falling back to the student dashboard for unknown roles. */
export function getRoleHome(role: UserRole | null | undefined): string {
  return role ? ROLE_HOME[role] : "/student-dashboard";
}

/** Each role's "My Courses" path. Used by the user dropdown and mobile header menu. */
export const ROLE_COURSES: Record<UserRole, string> = {
  administrator: "/admin",
  moderator: "/admin",
  teacher: "/teacher-dashboard/courses",
  student: "/student-dashboard/courses",
};

/** Resolve a role's "My Courses" path, falling back to the student dashboard for unknown roles. */
export function getRoleCourses(role: UserRole | null | undefined): string {
  return role ? ROLE_COURSES[role] : "/student-dashboard/courses";
}
