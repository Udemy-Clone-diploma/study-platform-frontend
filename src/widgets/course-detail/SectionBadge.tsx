type Props = { children: React.ReactNode };

/** Small lavender section label used above the instructor, feedback and tuition sections. */
export function SectionBadge({ children }: Props) {
  return (
    <span className="inline-flex w-fit items-center rounded-[4px] bg-(--color-badge-lavender) px-2.5 py-0.5 font-(family-name:--font-accent) text-xl font-medium uppercase text-(--color-blue)">
      {children}
    </span>
  );
}
