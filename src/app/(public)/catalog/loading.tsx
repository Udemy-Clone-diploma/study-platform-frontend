export default function CatalogLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        </header>

        <section className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article
                key={index}
                className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="mt-auto flex justify-between gap-3 border-t border-slate-200 pt-4">
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-9 w-24 animate-pulse rounded bg-slate-200" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
