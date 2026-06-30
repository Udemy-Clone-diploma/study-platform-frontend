"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GradientButton } from "@/shared/ui/GradientButton";
import type { CourseTest, TestAnswerInput, TestAttemptResult } from "@/entities/course";
import {
  byOrder,
  getTestAttempt,
  getTestAttempts,
  mockGradeAttempt,
  submitTestAttempt,
} from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { QuizQuestionCard, type AnswerState } from "./QuizQuestionCard";
import { QuizWindow } from "./QuizWindow";

type Props = {
  slug: string;
  test: CourseTest;
  isMock?: boolean;
  onPassed?: () => void;
};

const emptyAnswer = (): AnswerState => ({ selected: [], bool: null, text: "" });

function toAnswerInput(questionId: number, questionType: string, a: AnswerState): TestAnswerInput {
  if (questionType === "single_choice" || questionType === "multiple_choice")
    return { question_id: questionId, selected_indices: a.selected };
  if (questionType === "true_false")
    return { question_id: questionId, answer_bool: a.bool ?? undefined };
  return { question_id: questionId, answer_text: a.text };
}

export function QuizPlayer({ slug, test, isMock = false, onPassed }: Props) {
  const ordered = byOrder(test.questions);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>(() =>
    Object.fromEntries(ordered.map((q) => [q.id, emptyAnswer()])),
  );
  const [result, setResult] = useState<TestAttemptResult | null>(null);
  const [loading, setLoading] = useState(!isMock);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMock) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const attempts = await getTestAttempts(slug, test.id);
        if (cancelled || attempts.length === 0) return;
        const latest = attempts.reduce((a, b) => (b.attempt_number > a.attempt_number ? b : a));
        const detail = await getTestAttempt(slug, test.id, latest.id);
        if (!cancelled) setResult(detail);
      } catch {
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, test.id, isMock]);

  const restart = () => {
    setAnswers(Object.fromEntries(ordered.map((q) => [q.id, emptyAnswer()])));
    setResult(null);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const payload = ordered.map((q) => toAnswerInput(q.id, q.question_type, answers[q.id]));
    try {
      const res = isMock
        ? mockGradeAttempt(test, payload)
        : await submitTestAttempt(slug, test.id, payload);
      setResult(res);
      if (res.passed) onPassed?.();
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        (err as Partial<ApiError>).message ?? "Could not submit your answers. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <QuizWindow title={test.title} description={test.description} passingScore={test.passing_score}>
      {loading ? (
        <p role="status" className="py-8 text-center text-(--color-text-secondary)">
          Loading your test...
        </p>
      ) : (
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
          <div className="flex flex-col gap-5">
            {result
              ? byOrder(result.questions).map((g, i) => (
                  <QuizQuestionCard key={g.id} mode="review" index={i} graded={g} />
                ))
              : ordered.map((q, i) => (
                  <QuizQuestionCard
                    key={q.id}
                    mode="answer"
                    index={i}
                    questionType={q.question_type}
                    text={q.text}
                    options={q.options}
                    value={answers[q.id]}
                    onChange={(next) => setAnswers((prev) => ({ ...prev, [q.id]: next }))}
                  />
                ))}
          </div>

          {error && (
            <p role="alert" className="text-center text-base text-(--color-danger)">
              {error}
            </p>
          )}

          {result ? (
            <ResultsFooter slug={slug} result={result} onRetake={restart} />
          ) : (
            <div className="flex justify-center pt-1">
              <QuizButton onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "To the results"}
              </QuizButton>
            </div>
          )}
        </div>
      )}
    </QuizWindow>
  );
}

function ResultsFooter({
  slug,
  result,
  onRetake,
}: {
  slug: string;
  result: TestAttemptResult;
  onRetake: () => void;
}) {
  const answered = result.questions.filter(
    (q) =>
      (q.selected_indices?.length ?? 0) > 0 ||
      q.answer_bool != null ||
      (q.answer_text?.trim() ?? "") !== "",
  ).length;
  const incorrect = result.total_count - result.correct_count;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-wrap justify-center gap-x-16 gap-y-2 font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
        <span>
          Answered: {answered} / {result.total_count}
        </span>
        <span>Correct answers: {result.correct_count}</span>
        <span>Incorrect answers: {incorrect}</span>
      </div>

      <p
        className={`text-center font-(family-name:--font-base) text-xl leading-[25px] ${
          result.passed ? "text-(--color-quiz-correct)" : "text-(--color-pink-dark)"
        }`}
      >
        {result.passed
          ? "You passed!"
          : `You did not reach the passing score (${result.passing_score}%).`}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-5">
        <span className="font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
          Assessment:
        </span>
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-lg bg-(--color-brand-lavender) font-(family-name:--font-accent) text-2xl font-medium leading-[30px] text-(--color-blue-dark)">
          {result.score}
        </span>
        {result.can_retake && <GradientButton onClick={onRetake}>Retake</GradientButton>}
        <QuizButton href={`/learn/${slug}`}>Back to course</QuizButton>
      </div>
    </div>
  );
}

type QuizButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

function QuizButton({ children, href, onClick, disabled }: QuizButtonProps) {
  const classes =
    "inline-flex h-[30px] min-w-[124px] items-center justify-center rounded-full bg-(--color-text-primary) px-5 font-(family-name:--font-accent) text-xs font-medium leading-none text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
