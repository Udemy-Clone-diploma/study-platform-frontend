import { api } from "@/shared/api/base";
import type { MaterialLessonCard } from "../model/types";

/** Every lesson with attached documents across the student's enrolled courses. */
export async function getMaterials(params?: {
  course?: string;
  search?: string;
}): Promise<MaterialLessonCard[]> {
  const { data } = await api.get<MaterialLessonCard[]>("materials/", { params });
  return data;
}
