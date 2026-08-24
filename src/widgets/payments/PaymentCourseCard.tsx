"use client";

type PaymentCourseCardProps = {
  title: string;
  subtitle: string;
  amount: string;
  image?: string | null;
};

export function PaymentCourseCard({ title, subtitle, amount, image }: PaymentCourseCardProps) {
  return (
    <div className="flex min-h-[52px] w-full max-w-[365px] items-center gap-3 rounded-[10px] border border-[#F3E7C6] bg-[radial-gradient(circle_at_18%_50%,#FFF0B8_0%,#FFF8E9_38%,#FFFFFF_100%)] px-4 py-2 shadow-[0_0_12px_rgba(0,0,0,0.08)]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-[#FDD3D0]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] leading-3 font-semibold uppercase text-[#121212]">
          {title}
        </p>
        <p className="truncate text-[10px] leading-3 uppercase text-[#121212]">{subtitle}</p>
      </div>
      <span className="shrink-0 text-[14px] leading-4 text-[#121212]">{amount}</span>
    </div>
  );
}
