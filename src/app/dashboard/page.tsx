"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "student" | "teacher" | "moderator";

interface CurrentUser {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    status: string;
    avatar: string | null;
    language: string;
    is_blocked: boolean;
    date_joined: string;
    profile: unknown;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("currentUser");

        if (!storedUser) {
            router.replace("/register");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser) as CurrentUser;
            setUser(parsedUser);
        } catch {
            localStorage.removeItem("currentUser");
            router.replace("/register");
        }
    }, [router]);

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="text-lg">Завантаження...</p>
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
                        <span className="font-medium">Username:</span> {user.username}
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
                </div>
            </div>
        </main>
    );
}