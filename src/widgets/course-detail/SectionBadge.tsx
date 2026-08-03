type Props = { children: React.ReactNode };

/** Small lavender section label used above the instructor, feedback and tuition sections. */
export function SectionBadge({ children }: Props) {
  return (
    <span className="inline-flex w-fit items-center rounded-[3px] bg-(--color-badge-lavender) px-1.5 py-0.5 font-(family-name:--font-accent) text-[9px] leading-3 font-medium uppercase text-(--color-blue) sm:rounded-[4px] sm:px-2.5 sm:text-xl sm:leading-normal">
      {children}
    </span>
  );
}
