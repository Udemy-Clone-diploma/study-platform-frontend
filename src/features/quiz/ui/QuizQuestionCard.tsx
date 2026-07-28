"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { GradedQuestion } from "@/entities/course";

export type AnswerState = { selected: number[]; bool: boolean | null; text: string };

type AnswerProps = {
  mode: "answer";
  index: number;
  questionType: string;
  text: string;
  options: string[];
  value: AnswerState;
  onChange: (next: AnswerState) => void;
};

type ReviewProps = {
  mode: "review";
  index: number;
  graded: GradedQuestion;
};

type Props = AnswerProps | ReviewProps;

const optionLabel = (i: number) => `${String.fromCharCode(65 + i)})`;

const pillBase =
  "flex w-full items-center justify-between rounded-xl p-4 font-(family-name:--font-base) text-xl leading-[25px]";

export function QuizQuestionCard(props: Props) {
  const t = useTranslations("Quiz");
  const questionType = props.mode === "answer" ? props.questionType : props.graded.question_type;
  const text = props.mode === "answer" ? props.text : props.graded.text;
  const isChoice = questionType === "single_choice" || questionType === "multiple_choice";

  return (
    <div className="flex flex-col gap-5 rounded-[20px] bg-(--color-quiz-card-bg) px-10 py-5 shadow-(--shadow-quiz-card)">
      <div className="flex flex-col gap-2">
        <span className="font-(family-name:--font-base) text-2xl leading-[30px] text-(--color-black)">
          {t("question", { number: props.index + 1 })}
        </span>
        <p className="font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
          {text}
        </p>
      </div>

      {isChoice &&
        (props.mode === "answer" ? (
          <ChoiceAnswer
            single={questionType === "single_choice"}
            options={props.options}
            selected={props.value.selected}
            onChange={(selected) => props.onChange({ ...props.value, selected })}
          />
        ) : (
          <ChoiceReview graded={props.graded} single={questionType === "single_choice"} />
        ))}

      {questionType === "true_false" &&
        (props.mode === "answer" ? (
          <TrueFalseAnswer
            value={props.value.bool}
            onChange={(bool) => props.onChange({ ...props.value, bool })}
          />
        ) : (
          <TrueFalseReview graded={props.graded} />
        ))}

      {questionType === "short_answer" &&
        (props.mode === "answer" ? (
          <ShortAnswer
            value={props.value.text}
            onChange={(textValue) => props.onChange({ ...props.value, text: textValue })}
          />
        ) : (
          <ShortAnswerReview graded={props.graded} />
        ))}
    </div>
  );
}

function ChoiceIndicator({ checked, single }: { checked: boolean; single: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border border-(--color-blue) ${
        single ? "rounded-full" : "rounded-[2px]"
      } ${checked ? "bg-(--color-catalog-category-active)" : "bg-(--color-bg)"}`}
    >
      {checked &&
        (single ? (
          <span className="h-2 w-2 rounded-full bg-(--color-blue)" />
        ) : (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <path
              d="M1 4L4 7L10 1"
              stroke="var(--color-blue)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
    </span>
  );
}

function twoColumns(count: number): [number[], number[]] {
  const mid = Math.ceil(count / 2);
  const all = Array.from({ length: count }, (_, i) => i);
  return [all.slice(0, mid), all.slice(mid)];
}

function ChoiceAnswer({
  single,
  options,
  selected,
  onChange,
}: {
  single: boolean;
  options: string[];
  selected: number[];
  onChange: (selected: number[]) => void;
}) {
  const toggle = (i: number) => {
    if (single) {
      onChange([i]);
      return;
    }
    onChange(selected.includes(i) ? selected.filter((s) => s !== i) : [...selected, i]);
  };

  const [left, right] = twoColumns(options.length);
  const column = (indices: number[]) => (
    <div className="flex flex-1 flex-col gap-5">
      {indices.map((i) => (
        <button
          key={i}
          type="button"
          role={single ? "radio" : "checkbox"}
          aria-checked={selected.includes(i)}
          onClick={() => toggle(i)}
          className="flex items-center gap-2 text-left"
        >
          <ChoiceIndicator checked={selected.includes(i)} single={single} />
          <span className="font-(family-name:--font-base) text-xl leading-[25px] text-(--color-black)">
            {optionLabel(i)} {options[i]}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      role={single ? "radiogroup" : "group"}
      className="flex flex-col gap-5 sm:flex-row sm:gap-7"
    >
      {column(left)}
      {right.length > 0 && column(right)}
    </div>
  );
}

function choiceOptionColor(i: number, graded: GradedQuestion): string {
  const correct = graded.correct_indices?.includes(i) ?? false;
  const picked = graded.selected_indices?.includes(i) ?? false;
  if (correct) return "text-(--color-quiz-correct)";
  if (picked) return "text-(--color-brand-pink)";
  return "text-(--color-black)";
}

function ChoiceReview({ graded, single }: { graded: GradedQuestion; single: boolean }) {
  const [left, right] = twoColumns(graded.options.length);
  const column = (indices: number[]) => (
    <div className="flex flex-1 flex-col gap-5">
      {indices.map((i) => (
        <div key={i} className="flex items-center gap-2">
          <ChoiceIndicator checked={graded.selected_indices?.includes(i) ?? false} single={single} />
          <span
            className={`font-(family-name:--font-base) text-xl leading-[25px] ${choiceOptionColor(i, graded)}`}
          >
            {optionLabel(i)} {graded.options[i]}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-7">
      {column(left)}
      {right.length > 0 && column(right)}
    </div>
  );
}

type QuizSelectOption = { value: string; label: string };

function QuizSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: QuizSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className={`${pillBase} gradient-border-input cursor-pointer ${
          selected ? "text-(--color-text-primary)" : "text-(--color-text-secondary)"
        }`}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-6 w-6 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="gradient-border-input absolute left-0 right-0 top-[calc(100%+8px)] z-50 flex flex-col rounded-xl py-2"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left font-(family-name:--font-base) text-xl leading-[25px] text-(--color-text-primary) transition-colors hover:text-(--color-blue)"
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrueFalseAnswer({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const t = useTranslations("Quiz");
  const trueFalseOptions: QuizSelectOption[] = [
    { value: "true", label: t("true") },
    { value: "false", label: t("false") },
  ];
  return (
    <QuizSelect
      options={trueFalseOptions}
      value={value === null ? "" : String(value)}
      onChange={(v) => onChange(v === "true")}
      placeholder={t("selectAnswer")}
    />
  );
}

function TrueFalseReview({ graded }: { graded: GradedQuestion }) {
  const t = useTranslations("Quiz");
  const answered = graded.answer_bool != null;
  const bg = graded.is_correct
    ? "bg-(--color-quiz-correct)"
    : answered
      ? "bg-(--color-brand-pink)"
      : "bg-(--color-input-bg)";
  return (
    <div className="flex flex-col gap-2">
      <div className={`${pillBase} ${bg} text-(--color-black)`}>
        <span>{answered ? (graded.answer_bool ? t("true") : t("false")) : t("notAnswered")}</span>
        <ChevronRight className="h-8 w-8 shrink-0 rotate-90 text-(--color-black)" aria-hidden="true" />
      </div>
      {!graded.is_correct && graded.correct_bool != null && (
        <span className="font-(family-name:--font-base) text-base text-(--color-quiz-correct-soft)">
          {t("correctAnswer", { value: graded.correct_bool ? t("true") : t("false") })}
        </span>
      )}
    </div>
  );
}

function ShortAnswer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("Quiz");
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t("enterAnswer")}
      className={`quiz-answer-input ${pillBase} bg-(--color-input-bg) text-(--color-text-primary) outline-none`}
    />
  );
}

function ShortAnswerReview({ graded }: { graded: GradedQuestion }) {
  const t = useTranslations("Quiz");
  const answer = graded.answer_text?.trim() ?? "";
  const bg = graded.is_correct ? "bg-(--color-quiz-correct)" : "bg-(--color-brand-pink)";
  const correct = graded.accepted_answers?.length
    ? graded.accepted_answers.join(", ")
    : graded.sample_answer;
  return (
    <div className="flex flex-col gap-2">
      <div className={`${pillBase} ${bg} text-(--color-black)`}>
        <span>{answer || t("noAnswer")}</span>
      </div>
      {correct && (
        <span className="font-(family-name:--font-base) text-base text-(--color-quiz-correct-soft)">
          {t("correctAnswer", { value: correct })}
        </span>
      )}
    </div>
  );
}
