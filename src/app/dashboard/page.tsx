"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/features/auth/api/authApi";
import { logout } from "@/features/auth/actions/logout";
import type { UserData } from "@/features/auth/model/types/userData";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        setUser(me);
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Не вдалося завантажити профіль.");
        router.replace("/login");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.replace("/login");
      router.refresh();
    });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Завантаження...</p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-600">{error || "Користувача не знайдено."}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-3xl font-semibold">Dashboard</h1>

        <div className="space-y-3 text-sm text-gray-800">
          <p>
            <span className="font-medium">ID:</span> {user.id}
          </p>
          <p>
            <span className="font-medium">Full name:</span> {user.first_name} {user.last_name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium">Role:</span> {user.role}
          </p>
          <p>
            <span className="font-medium">Language:</span> {user.language}
          </p>
          <p>
            <span className="font-medium">Status:</span> {user.status}
          </p>
          <p>
            <span className="font-medium">Blocked:</span> {user.is_blocked ? "Yes" : "No"}
          </p>
          <p>
            <span className="font-medium">Joined:</span> {user.date_joined}
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </main>
  );
}
