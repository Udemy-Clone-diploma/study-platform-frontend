import type { CourseTest } from "../model/module";
import type { GradedQuestion, TestAnswerInput, TestAttemptResult } from "../model/attempt";

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length &&
  [...a].sort((x, y) => x - y).join(",") === [...b].sort((x, y) => x - y).join(",");

function awardedFor(q: CourseTest["questions"][number], a: TestAnswerInput | undefined): number {
  const correctIndices = q.correct_indices ?? [];

  if (q.question_type === "single_choice" || q.question_type === "multiple_choice") {
    const selected = a?.selected_indices ?? [];
    if (q.question_type === "multiple_choice" && q.exact_set_match === false) {
      const correctPicked = selected.filter((i) => correctIndices.includes(i)).length;
      const wrongPicked = selected.length - correctPicked;
      return correctIndices.length
        ? Math.max(0, (correctPicked - wrongPicked) / correctIndices.length)
        : 0;
    }
    return sameSet(selected, correctIndices) ? 1 : 0;
  }

  if (q.question_type === "true_false") {
    return a?.answer_bool != null && a.answer_bool === q.correct_bool ? 1 : 0;
  }

  const text = normalize(a?.answer_text ?? "");
  const accepted = [q.sample_answer ?? "", ...(q.accepted_answers ?? [])]
    .map(normalize)
    .filter(Boolean);
  return text !== "" && accepted.includes(text) ? 1 : 0;
}

export function mockGradeAttempt(test: CourseTest, answers: TestAnswerInput[]): TestAttemptResult {
  const byId = new Map(answers.map((a) => [a.question_id, a]));

  let awardedSum = 0;
  const questions: GradedQuestion[] = test.questions.map((q) => {
    const a = byId.get(q.id);
    const awarded = awardedFor(q, a);
    awardedSum += awarded;
    const correctIndices = q.correct_indices ?? [];
    return {
      id: q.id,
      question_type: q.question_type as GradedQuestion["question_type"],
      text: q.text,
      options: q.options,
      order: q.order,
      selected_indices: a?.selected_indices,
      answer_bool: a?.answer_bool ?? null,
      answer_text: a?.answer_text,
      is_correct: awarded === 1,
      correct_indices: correctIndices.length ? correctIndices : undefined,
      correct_bool: q.correct_bool,
      sample_answer: q.sample_answer || undefined,
      accepted_answers: q.accepted_answers ?? undefined,
    };
  });

  const correctCount = questions.filter((q) => q.is_correct).length;
  const totalCount = questions.length;
  const score = totalCount ? Math.round((awardedSum / totalCount) * 100) : 0;

  return {
    attempt_id: Date.now(),
    attempt_number: 1,
    score,
    correct_count: correctCount,
    total_count: totalCount,
    passed: score >= test.passing_score,
    passing_score: test.passing_score,
    can_retake: test.allow_retakes ?? true,
    attempts_used: 1,
    max_attempts: test.max_attempts ?? null,
    questions,
  };
}
