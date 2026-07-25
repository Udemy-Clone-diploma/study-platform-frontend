"use client";

import { Suspense } from "react";
import { TeacherApplicationsAdminView } from "@/features/teacher-application";

export default function AdminTeacherApplicationsPage() {
  return (
    <Suspense>
      <TeacherApplicationsAdminView />
    </Suspense>
  );
}
