import Image from "next/image";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  contentClassName?: string;
  /** When set, renders a left-hand image column (desktop only) instead of the gradient stripes. */
  imageSrc?: string;
}

export function AuthShell({ children, contentClassName = "max-w-[700px]", imageSrc }: AuthShellProps) {
  if (imageSrc) {
    return (
      <section className="mx-auto flex w-full max-w-[1400px] flex-col rounded-[0.8rem] border border-white bg-white text-[#171417] shadow-[0_0_24.5px_0_#A7BAFA] lg:h-[750px] lg:flex-row lg:gap-10 lg:p-8">
        <div className="relative hidden shrink-0 overflow-hidden rounded-[0.8rem] lg:block lg:w-[42%]">
          <Image src={imageSrc} alt="" fill priority className="object-cover" sizes="(min-width: 1024px) 42vw, 0px" />
        </div>

        <div className={`mx-auto flex w-full flex-1 items-center px-8 py-10 md:px-[80px] lg:px-12 ${contentClassName}`}>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex h-auto w-full max-w-[1400px] flex-col rounded-[0.8rem] border border-white bg-white px-8 py-[42px] text-[#171417] shadow-[0_0_24.5px_0_#A7BAFA] md:h-[750px] md:px-[121px]">
      <div className="hidden h-3 w-full max-w-[940px] self-center rounded-full bg-[url('/auth/gradient-stripes.png')] bg-cover bg-center lg:block" />

      <div className={`mx-auto flex w-full flex-1 items-center py-8 ${contentClassName}`}>
        {children}
      </div>

      <div className="hidden h-3 w-full max-w-[940px] self-center rounded-full bg-[url('/auth/gradient-stripes.png')] bg-cover bg-center lg:block" />
    </section>
  );
}
