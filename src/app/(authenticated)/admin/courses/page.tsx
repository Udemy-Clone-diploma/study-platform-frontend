"use client";

import { Suspense } from "react";
import { withAuth } from "@/features/auth";
import { CoursesAdminView } from "@/features/courses";

const ProtectedCoursesAdminView = withAuth(CoursesAdminView, {
  allowedRoles: ["administrator"],
});

export default function AdminCoursesPage() {
  return (
    <Suspense>
      <ProtectedCoursesAdminView />
    </Suspense>
  );
}
