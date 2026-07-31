import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  slug: string;
  active: "course" | "progress";
};

/** Centered "Course / Progress" switch shared by all three lesson-player views. */
export function LearnTabs({ slug, active }: Props) {
  const t = useTranslations("LearnTabs");
  return (
    <nav aria-label={t("ariaLabel")} className="mx-auto flex items-center gap-5 lg:gap-10">
      <LearnTab href={`/learn/${slug}`} label={t("course")} isActive={active === "course"} />
      <LearnTab
        href={`/learn/${slug}?tab=progress`}
        label={t("progress")}
        isActive={active === "progress"}
      />
    </nav>
  );
}

/** One tab: a gradient-underlined label when active, a hover-underlined link otherwise. */
function LearnTab({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  if (isActive) {
    return (
      <span
        aria-current="page"
        className="relative inline-flex flex-col items-stretch font-(family-name:--font-accent) text-sm uppercase text-(--color-text-primary) lg:text-xl"
      >
        {label}
        <span
          aria-hidden="true"
          className="mt-[5px] h-1 w-full rounded-full"
          style={{ background: "var(--gradient-brand)" }}
        />
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="font-(family-name:--font-accent) text-sm uppercase text-(--color-text-primary) hover:underline lg:text-xl"
    >
      {label}
    </Link>
  );
}
