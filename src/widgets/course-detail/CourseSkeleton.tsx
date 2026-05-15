/** Loading skeleton shown while the course detail page is fetching. */
export function CourseSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-16 py-16">
      <section className="flex flex-col gap-5">
        <div className="h-6 w-24 rounded bg-(--color-placeholder)" />
        <div className="h-14 w-3/4 rounded bg-(--color-placeholder)" />
        <div className="h-5 w-full rounded bg-(--color-placeholder)" />
        <div className="h-5 w-5/6 rounded bg-(--color-placeholder)" />
        <div className="h-5 w-2/3 rounded bg-(--color-placeholder)" />
        <div className="mt-4 flex gap-3">
          <div className="h-8 w-32 rounded-full bg-(--color-placeholder)" />
          <div className="h-8 w-32 rounded-full bg-(--color-placeholder)" />
          <div className="h-8 w-32 rounded-full bg-(--color-placeholder)" />
        </div>
        <div className="mt-4 h-12 w-48 rounded-3xl bg-(--color-placeholder)" />
      </section>

      <section className="flex flex-col gap-6">
        <div className="h-9 w-40 rounded bg-(--color-placeholder)" />
        <div className="flex gap-6">
          <div className="h-32 w-32 rounded-full bg-(--color-placeholder)" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-7 w-1/3 rounded bg-(--color-placeholder)" />
            <div className="h-5 w-full rounded bg-(--color-placeholder)" />
            <div className="h-5 w-5/6 rounded bg-(--color-placeholder)" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="h-11 w-64 rounded bg-(--color-placeholder)" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded bg-(--color-placeholder)" />
        ))}
      </section>
    </div>
  );
}
