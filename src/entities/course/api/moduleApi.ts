import { api } from "@/shared/api/base";
import type { CourseModule } from "../model/module";

const COURSES = "courses/";

export async function createModule(courseSlug: string, data: { title: string }): Promise<CourseModule> {
  const { data: result } = await api.post<CourseModule>(`${COURSES}${courseSlug}/modules/`, data);
  return result;
}

export async function updateModule(
  courseSlug: string,
  moduleId: number,
  data: { title: string },
): Promise<CourseModule> {
  const { data: result } = await api.patch<CourseModule>(
    `${COURSES}${courseSlug}/modules/${moduleId}/`,
    data,
  );
  return result;
}

export async function deleteModule(courseSlug: string, moduleId: number): Promise<void> {
  await api.delete(`${COURSES}${courseSlug}/modules/${moduleId}/`);
}
