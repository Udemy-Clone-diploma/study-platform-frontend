import { api } from "@/shared/api/base";
import type { TopTeacher } from "@/features/users/model/types/teacher";

export async function getTopTeachers(limit = 4): Promise<TopTeacher[]> {
    const { data } = await api.get<TopTeacher[]>("users/top-teachers/", {
        params: { limit },
    });
    return data;
}
