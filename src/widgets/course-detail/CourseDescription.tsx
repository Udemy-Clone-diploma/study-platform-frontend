type Props = { html: string };

/** Renders course full_description as HTML. Sanitization temporarily disabled while debugging webpack issue. */
export function CourseDescription({ html }: Props) {
  return (
    <div
      className="text-lg text-(--color-text-primary) [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_li]:my-1 [&_p]:my-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
