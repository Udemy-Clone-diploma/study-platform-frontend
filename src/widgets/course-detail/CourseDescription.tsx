import { sanitizeCourseHtml } from "@/shared/lib/sanitizeCourseHtml";

type Props = { html: string };

/** Renders course full_description as sanitized HTML produced by the (future) rich-text editor. */
export function CourseDescription({ html }: Props) {
  const clean = sanitizeCourseHtml(html);
  return (
    <div
      className="text-[13px] leading-[1.25] text-(--color-text-primary) md:text-xl md:leading-normal lg:text-2xl [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold md:[&_h3]:mt-6 md:[&_h3]:mb-3 md:[&_h3]:text-2xl [&_li]:my-0.5 md:[&_li]:my-1 [&_p]:my-2 md:[&_p]:my-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 md:[&_ul]:pl-6 [&_table]:my-4 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
