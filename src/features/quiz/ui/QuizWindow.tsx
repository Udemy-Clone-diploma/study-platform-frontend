import type { ReactNode } from "react";

type QuizWindowProps = {
  title: string;
  description?: string | null;
  passingScore: number;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Shared framed quiz layout: title panel plus the question workspace. */
export function QuizWindow({
  title,
  description,
  passingScore,
  headerAction,
  children,
  className = "",
}: QuizWindowProps) {
  return (
    <div className={`mx-auto flex w-full max-w-[1380px] flex-col gap-2 ${className}`}>
      <header className="relative flex min-h-[150px] flex-col justify-center rounded-[16px] bg-white px-6 py-5 shadow-(--shadow-dashboard-card) sm:px-10 lg:px-[50px]">
        {headerAction ? <div className="absolute top-5 right-5">{headerAction}</div> : null}
        <div className="flex max-w-[1120px] flex-col gap-4">
          <h2 className="font-(family-name:--font-base) text-[2rem] leading-10 font-normal text-(--color-text-primary)">
            {title}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            {description ? (
              <p className="flex-1 font-(family-name:--font-base) text-xl leading-[25px] text-(--color-text-primary)">
                {description}
              </p>
            ) : (
              <span className="flex-1" aria-hidden="true" />
            )}
            <span className="shrink-0 whitespace-nowrap font-(family-name:--font-accent) text-base font-semibold leading-5 text-(--color-text-primary)">
              Passing Score: {passingScore}
            </span>
          </div>
        </div>
      </header>

      <div className="rounded-[16px] bg-white px-5 pt-8 pb-10 sm:px-8 lg:px-[57px] lg:pt-10 lg:pb-[55px]">
        {children}
      </div>
    </div>
  );
}
