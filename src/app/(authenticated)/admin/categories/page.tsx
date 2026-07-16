"use client";

import { Suspense } from "react";
import { withAuth } from "@/features/auth";
import { CategoriesAdminView } from "@/features/courses";

const ProtectedCategoriesAdminView = withAuth(CategoriesAdminView, {
  allowedRoles: ["administrator"],
});

export default function AdminCategoriesPage() {
  return (
    <Suspense>
      <ProtectedCategoriesAdminView />
    </Suspense>
  );
}
