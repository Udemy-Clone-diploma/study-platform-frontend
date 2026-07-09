import { api } from "@/shared/api/base";
import type { NoteListItem, Paginated } from "../model/types";

/** Every lesson note the current user has written, across all courses. */
export async function getAllNotes(page = 1, pageSize?: number): Promise<Paginated<NoteListItem>> {
  const { data } = await api.get<Paginated<NoteListItem>>("notes/", {
    params: { page, ...(pageSize ? { page_size: pageSize } : {}) },
  });
  return data;
}
