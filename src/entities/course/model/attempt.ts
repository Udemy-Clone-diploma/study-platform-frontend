import type { QuestionType } from "./module";

export type TestAnswerInput = {
  question_id: number;
  selected_indices?: number[];
  answer_bool?: boolean;
  answer_text?: string;
};

export type TestAttemptListItem = {
  id: number;
  attempt_number: number;
  score: number;
  passed: boolean;
  submitted_at: string;
};

export type GradedQuestion = {
  id: number;
  question_type: QuestionType;
  text: string;
  options: string[];
  order: number;
  selected_indices?: number[];
  answer_bool?: boolean | null;
  answer_text?: string;
  is_correct: boolean;
  correct_indices?: number[];
  correct_bool?: boolean | null;
  sample_answer?: string;
  accepted_answers?: string[];
};

export type TestAttemptResult = {
  attempt_id: number;
  attempt_number: number;
  score: number;
  correct_count: number;
  total_count: number;
  passed: boolean;
  passing_score: number;
  can_retake: boolean;
  attempts_used: number;
  max_attempts: number | null;
  questions: GradedQuestion[];
};
