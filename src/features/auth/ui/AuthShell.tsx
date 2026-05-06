import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  contentClassName?: string;
}

export function AuthShell({ children, contentClassName = "max-w-[700px]" }: AuthShellProps) {
  return (
    <section className="mx-auto flex h-auto w-full max-w-[1400px] flex-col rounded-[0.8rem] border border-white bg-white px-8 py-[42px] text-[#171417] shadow-[0_0_24.5px_0_#A7BAFA] md:h-[750px] md:px-[121px]">
      <div className="h-3 w-full max-w-[940px] self-center rounded-full bg-[url('/auth/gradient-stripes.png')] bg-cover bg-center" />

      <div className={`mx-auto flex w-full flex-1 items-center py-8 ${contentClassName}`}>
        {children}
      </div>

      <div className="h-3 w-full max-w-[940px] self-center rounded-full bg-[url('/auth/gradient-stripes.png')] bg-cover bg-center" />
    </section>
  );
}
