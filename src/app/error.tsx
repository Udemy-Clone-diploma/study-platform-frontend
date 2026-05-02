"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold text-red-600">Щось пішло не так</h1>
      <p className="max-w-md text-sm text-gray-600">
        Сталася непередбачена помилка. Спробуйте ще раз або поверніться на головну.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
      >
        Спробувати ще раз
      </button>
    </main>
  );
}
