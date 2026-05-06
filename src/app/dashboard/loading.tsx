export default function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-6 h-9 w-40 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-4 w-full animate-pulse rounded bg-gray-200" />
          ))}
        </div>
        <div className="m-6 h-12 w-full animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    </main>
  );
}
