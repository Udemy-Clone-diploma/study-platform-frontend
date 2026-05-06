import type { ReactNode } from "react";
import { AuthShell } from "@/features/auth/ui/AuthShell";

interface AuthPanelProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

export function AuthPanel({ title, description, children }: AuthPanelProps) {
  return (
    <AuthShell contentClassName="max-w-[520px]">
      <section className="w-full text-center text-[#171417]">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-[2.15rem] font-medium tracking-[0.08em] text-[#171417] uppercase sm:text-[2.7rem]">
              {title}
            </h1>
            {description ? (
              <p className="text-[0.98rem] leading-6 text-[#3e3840]">{description}</p>
            ) : null}
          </div>

          {children}
        </div>
      </section>
    </AuthShell>
  );
}
