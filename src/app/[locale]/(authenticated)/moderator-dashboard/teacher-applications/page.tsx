"use client";

import { Suspense } from "react";
import { TeacherApplicationsAdminView } from "@/features/teacher-application";

export default function ModeratorTeacherApplicationsPage() {
  return (
    <Suspense>
      <TeacherApplicationsAdminView />
    </Suspense>
  );
}
