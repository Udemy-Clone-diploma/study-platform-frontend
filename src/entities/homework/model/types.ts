export type HomeworkAssignmentStatus = "draft" | "published" | "closed";

export type HomeworkAssignment = {
  id: number;
  course_id: number;
  module: number | null;
  lesson: number | null;
  title: string;
  description: string;
  due_at: string | null;
  max_score: number | null;
  status: HomeworkAssignmentStatus;
  created_at: string;
  updated_at: string;
};

export type HomeworkAssignmentInput = {
  module?: number | null;
  lesson?: number | null;
  title: string;
  description: string;
  due_at?: string;
  max_score?: number;
};
